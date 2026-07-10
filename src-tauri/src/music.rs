use rodio::{Decoder, Sink, Source};
use std::{fs::File, io::BufReader, sync::Arc, time};
use tauri_plugin_log::log;

use crate::equalizer::{EqualizerParams, EqualizerSource};
use crate::types::SongTable;

pub struct MusicPlayer {
    pub sink: Sink,
    pub position: usize,
    pub repeat_mode: i64,
    pub queue: Vec<SongTable>,
    pub is_active: bool,
    pub visualizer_buffer: crate::visualizer::VisualizerBuffer,
    pub current_sample_rate: u32,
    pub equalizer_params: Arc<EqualizerParams>, // BARU
}

// Rework Parts
impl MusicPlayer {
    pub fn new(sink: Sink, equalizer_params: Arc<EqualizerParams>) -> Result<Self, String> {
        sink.pause();

        Ok(Self {
            sink,
            position: 0,
            repeat_mode: 1,
            queue: vec![],
            is_active: false,
            visualizer_buffer: crate::visualizer::new_buffer(),
            current_sample_rate: 44100,
            equalizer_params, // BARU
        })
    }

    // ------------------- Simple Media Functions -------------------
    // Play the song in the seek
    pub fn play_song(&self) {
        self.sink.play();
    }
    // Pause the song in the sink
    pub fn pause_song(&self) {
        self.sink.pause();
    }
    // Stop the song in the sink
    pub fn stop_song(&mut self) {
        self.sink.stop();
        self.is_active = false;
    }
    // Get current playback position in seconds
    pub fn get_song_pos(&self) -> u64 {
        self.sink.get_pos().as_secs()
    }

    // Change the time of the song
    pub fn seek(&self, position: u64) {
        // println!("position: {:?}", time::Duration::from_secs(position));
        let _ = self
            .sink
            .try_seek(time::Duration::from_secs(position))
            .map_err(|op| println!("{:?}", op));
    }
    // Set the repeat mode for the player
    pub fn set_repeat_mode(&mut self, mode: i64) {
        self.repeat_mode = mode;
    }
    // Change the volume of the sink
    pub fn set_volume(&self, vol: f32) {
        self.sink.set_volume(vol);
    }
    // Move and play the next song in the queue
    pub fn next_song(&mut self) {
        // no repeat
        if self.repeat_mode == 0 {
            // FIX: kondisi sebelumnya (`position + 1 == queue.len() - 1`)
            // berhenti satu lagu terlalu cepat, di posisi len-2, sehingga
            // lagu terakhir di queue tidak pernah ikut diputar saat mode
            // "No Repeat". Seharusnya baru berhenti kalau posisi berikutnya
            // sudah melewati akhir queue (position + 1 >= queue.len()).
            if self.position + 1 >= self.queue.len() {
                self.position = 0;
                self.sink.stop();
            } else {
                let new_pos = self.position + 1;
                // Update the current position in the player
                let _ = self.update_current_index(new_pos);

                // --- PERBAIKAN DI SINI ---
                // Kosongkan sink dari lagu lama agar watcher background tidak bingung,
                // lalu load ulang lagu baru dari disk (bukan skip_one).
                self.sink.clear();
                let _ = self.load_song(new_pos);
                self.play_song();
                // -------------------------
            }
        }
        // repeat the queue
        else if self.repeat_mode == 1 {
            self.sink.clear();
            let mut new_pos = self.position + 1;
            // If the new position will be larger than the length of the queue, reset to 0
            if new_pos >= self.queue.len() {
                new_pos = 0;
            }
            // Update the current position in the player
            let _ = self.update_current_index(new_pos);
            // Load the new song
            let _ = self.load_song(new_pos);
            self.play_song();
        }
        // Repeat one song
        else {
            self.seek(0);
            self.play_song();
        }
    }
    // Move and play the previous song in the queue
    pub fn previous_song(&mut self) {
        // Drop all the songs in the sink, then load new songs
        self.sink.clear();

        let new_pos;
        // If the new position will be smaller than the starting song, set the pos to the last song in the queue
        if self.position == 0 {
            new_pos = self.queue.len() - 1;
        } else {
            new_pos = self.position - 1;
        }

        let _ = self.update_current_index(new_pos);
        // Load the first song
        let _ = self.load_song(new_pos);
        self.play_song();

        // If the new position plus 1 is less than the queue length, load next song
        if (1 + new_pos) < self.queue.len() {
            let _ = self.load_song(new_pos + 1);
        }
    }

    // Dipanggil oleh background watcher saat lagu selesai diputar SECARA ALAMI
    // (bukan karena user pencet next/previous). Sink sudah pasti kosong di titik ini,
    // jadi selalu load ulang dari disk (tidak bisa gapless di titik ini).
    pub fn advance_after_finish(&mut self) -> Option<SongTable> {
        if self.queue.is_empty() {
            self.is_active = false;
            return None;
        }

        if self.repeat_mode == 2 {
            // Ulangi satu lagu
            let _ = self.load_song(self.position);
            self.play_song();
            return self.get_current_song().ok();
        }

        if self.repeat_mode == 0 {
            // Tidak mengulang - berhenti di akhir queue
            if self.position + 1 >= self.queue.len() {
                self.is_active = false;
                return None;
            }
            self.position += 1;
            let _ = self.load_song(self.position);
            self.play_song();
            return self.get_current_song().ok();
        }

        // Ulangi semua (repeat_mode == 1)
        let mut new_pos = self.position + 1;
        if new_pos >= self.queue.len() {
            new_pos = 0;
        }
        self.position = new_pos;
        let _ = self.load_song(self.position);
        self.play_song();
        self.get_current_song().ok()
    }

    // ------------------- Queue Functions -------------------
    // Called when a user clicks play on a song, album, or playlist
    pub fn set_queue(&mut self, q: Vec<SongTable>) {
        self.queue = q;
        // self.sink.stop();
        self.position = 0;
    }
    // Clear the queue and empty the sink
    pub fn clear_queue(&mut self) {
        self.sink.stop();
        self.queue.clear();
        self.position = 0;
        self.is_active = false;
    }
    // Called when a user adds a song to the queue
    pub fn add_to_queue(&mut self, q: Vec<SongTable>) {
        for song in q {
            self.queue.push(song);
        }
    }

    // Sisipkan lagu tepat setelah lagu yang sedang diputar ("Putar Berikutnya")
    pub fn insert_next(&mut self, songs: Vec<SongTable>) {
        let insert_at = if self.queue.is_empty() {
            0
        } else {
            self.position + 1
        };
        for (i, song) in songs.into_iter().enumerate() {
            let at = (insert_at + i).min(self.queue.len());
            self.queue.insert(at, song);
        }
    }

    // Hapus satu lagu dari queue berdasarkan index.
    // Tidak boleh untuk lagu yang sedang diputar - frontend juga akan disable
    // tombolnya, tapi kita jaga juga di sini.
    pub fn remove_from_queue(&mut self, index: usize) -> Result<(), String> {
        if index >= self.queue.len() {
            return Err("index out of bounds".to_string());
        }
        if index == self.position {
            return Err("cannot remove the currently playing song".to_string());
        }
        self.queue.remove(index);
        if index < self.position {
            self.position -= 1;
        }
        Ok(())
    }

    // Pindahkan lagu dari satu index ke index lain (drag-and-drop reorder)
    pub fn reorder_queue(&mut self, from: usize, to: usize) -> Result<(), String> {
        if from >= self.queue.len() || to >= self.queue.len() {
            return Err("index out of bounds".to_string());
        }
        if from == to {
            return Ok(());
        }
        let song = self.queue.remove(from);
        self.queue.insert(to, song);

        if from == self.position {
            self.position = to;
        } else if from < self.position && to >= self.position {
            self.position -= 1;
        } else if from > self.position && to <= self.position {
            self.position += 1;
        }
        Ok(())
    }

    // Loncat langsung ke index tertentu di queue yang sudah ada dan putar
    // (dipakai saat user klik lagu di dalam widget Queue).
    pub fn jump_to_index(&mut self, index: usize) -> Result<(), String> {
        if index >= self.queue.len() {
            return Err("index out of bounds".to_string());
        }
        self.sink.clear();
        self.position = index;
        self.load_song(index)?;
        self.play_song();
        Ok(())
    }

    pub fn get_current_queue(&self) -> &Vec<SongTable> {
        return &self.queue;
    }

    pub fn get_queue_length(&self) -> usize {
        return self.queue.len();
    }

    // Returns the queue index of the current song
    pub fn get_current_index(&self) -> usize {
        return self.position;
    }

    // Returns the actual playback position in seconds
    pub fn get_current_position(&self) -> u64 {
        return self.sink.get_pos().as_secs();
    }

    pub fn update_current_index(&mut self, pos: usize) -> Result<(), String> {
        if pos > self.queue.len() {
            println!("position is larger than queue length - setting to zero");
            self.position = 0;
            log::error!("Update Current Index MusicPlayer - Position is larger than Queue length");
            Err("position is larger than queue length".to_string())
        } else if pos == self.position {
            Ok(())
        } else {
            self.position = pos;
            Ok(())
        }
    }

    // ------------------- Checker Functions -------------------
    pub fn get_current_song(&self) -> Result<SongTable, bool> {
        if self.queue.len() > 0 {
            return Ok(self.queue[self.position].clone());
        } else {
            log::error!("Get Current Song MusicPlayer - Error decoding Audio File");
            return Err(false);
        }
    }

    pub fn check_is_paused(&self) -> bool {
        return self.sink.is_paused();
    }

    #[allow(dead_code)]
    pub fn check_is_loaded(&self) -> bool {
        return !self.sink.empty();
    }

    pub fn check_repeat_mode(&self) -> i64 {
        return self.repeat_mode;
    }

    // ------------------- Media Loading / Setup Functions -------------------

    pub fn load_song(&mut self, pos: usize) -> Result<(), String> {
        // Get the path of the song from the queue
        if self.queue.len() > 0 {
            let path = &self.queue[pos].path;
            let file = File::open(&path);

            // No error reading the file path
            if file.is_ok() {
                let good_file = file.unwrap();
                // Makes it a little faster if we are guessing with only mp3 files
                // Length is needed for backwards seeking
                let len = good_file.metadata().unwrap().len();
                match Decoder::builder()
                    .with_data(BufReader::new(good_file))
                    .with_hint("mp3")
                    .with_byte_len(len)
                    .with_seekable(true)
                    .with_gapless(true)
                    .build()
                {
                    Ok(source) => {
                        self.current_sample_rate = source.sample_rate();

                        // BARU: chaining EQ dulu SEBELUM tap visualizer, supaya
                        // visualizer nampilin suara yang sudah di-EQ (yang beneran
                        // didengar user), bukan sinyal mentah sebelum diproses.
                        //   decoder -> EqualizerSource -> TapSource -> sink
                        let equalized =
                            EqualizerSource::new(source, self.equalizer_params.clone());
                        let tapped = crate::visualizer::TapSource::new(
                            equalized,
                            self.visualizer_buffer.clone(),
                        );

                        self.sink.append(tapped);

                        self.is_active = true;
                        log::info!(
                            "Load Song - Song Successfully loaded - {:?} -- {:?}",
                            &self.queue[pos].name,
                            &self.queue[pos].album
                        );
                        // println!("Song is loaded");
                    }
                    Err(e) => {
                        log::error!("Load Song - Error decoding Audio File");
                        eprintln!("Error decoding audio file: {}", e);
                    }
                };
                return Ok(());
            }
            // If there is an error reading in the file (ex. File has been moved an doesn't exist in that location)
            else {
                log::error!("Load Song - Song file does not exist");
                return Err("Song does not exist".to_string());
            }
        }

        Ok(())
    }

    // Just for debugging new gapless features
    pub fn get_sink_length(&self) -> usize {
        return self.sink.len();
    }
}