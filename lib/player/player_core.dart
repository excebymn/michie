import 'package:flutter/material.dart';

class PlayerCore extends StatefulWidget {
  const PlayerCore({super.key});

  @override
  State<PlayerCore> createState() => _PlayerCoreState();
}

class _PlayerCoreState extends State<PlayerCore> {
  bool isPlaying = false;
  bool isFavorite = false;
  double progress = .25;

  final List<Map<String, dynamic>> quickActions = [
    {'icon': Icons.queue_music, 'title': 'Queue'},
    {'icon': Icons.lyrics, 'title': 'Lyrics'},
    {'icon': Icons.playlist_play, 'title': 'Playlist'},
    {'icon': Icons.equalizer, 'title': 'Equalizer'},
  ];

  void openQuickActions() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        child: Container(
          width: 300,
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: quickActions.map((item) {
              return ListTile(
                leading: Icon(item['icon']),
                title: Text(item['title']),
                onTap: () => Navigator.pop(context),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final coverSize = width.clamp(220.0, 420.0);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            Colors.deepPurple.shade900,
            Colors.black,
          ],
        ),
      ),
      child: Column(
        children: [
          Container(
            width: coverSize,
            height: coverSize,
            decoration: BoxDecoration(
              color: Colors.white12,
              borderRadius: BorderRadius.circular(28),
            ),
          ),

          const SizedBox(height: 20),

          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'No song selected',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Drop folder or open library',
                      style: TextStyle(
                        color: Colors.white70,
                      ),
                    )
                  ],
                ),
              ),
              IconButton(
                onPressed: openQuickActions,
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  fixedSize: const Size(50, 50),
                ),
                icon: const Icon(Icons.grid_view_rounded),
              )
            ],
          ),

          Slider(
            value: progress,
            onChanged: (v) {
              setState(() => progress = v);
            },
          ),

          const Row(
            children: [
              Text('0:00',style: TextStyle(color: Colors.white70)),
              Spacer(),
              Text(
                '44.1kHz • 320kbps • FLAC',
                style: TextStyle(color: Colors.white70),
              ),
              Spacer(),
              Text('0:00',style: TextStyle(color: Colors.white70)),
            ],
          ),

          const SizedBox(height: 30),

          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              control(Icons.skip_previous),
              const SizedBox(width: 10),
              SizedBox(
                height: 70,
                width: 110,
                child: FilledButton(
                  onPressed: () {
                    setState(() {
                      isPlaying = !isPlaying;
                    });
                  },
                  child: Icon(
                    isPlaying
                        ? Icons.pause
                        : Icons.play_arrow,
                    size: 34,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              control(Icons.skip_next),
            ],
          ),

          const SizedBox(height: 24),

          Row(
            children: [
              action(Icons.shuffle),
              action(Icons.repeat),
              action(
                isFavorite
                    ? Icons.favorite
                    : Icons.favorite_border,
                onTap: () {
                  setState(() {
                    isFavorite = !isFavorite;
                  });
                },
              )
            ],
          )
        ],
      ),
    );
  }

  Widget control(IconData icon) {
    return IconButton(
      onPressed: () {},
      style: IconButton.styleFrom(
        backgroundColor: Colors.white10,
        fixedSize: const Size(80, 70),
      ),
      icon: Icon(icon, color: Colors.white),
    );
  }

  Widget action(IconData icon,{VoidCallback? onTap}) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: IconButton(
          onPressed:onTap ?? (){},
          style: IconButton.styleFrom(
            backgroundColor: Colors.white10,
          ),
          icon: Icon(icon,color: Colors.white),
        ),
      ),
    );
  }
}
