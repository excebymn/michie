import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: HomePage(),
    ),
  );
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;

    // breakpoint
    final compact = width < 800;
    final medium = width < 1200;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [

              // KIRI
              if (!compact && !medium) ...[
                Expanded(
                  child: Column(
                    children: [
                      Expanded(
                        child: panel(
                          Colors.black,
                          "Top Left",
                        ),
                      ),

                      const SizedBox(height: 8),

                      Expanded(
                        child: panel(
                          Colors.amber,
                          "Bottom Left",
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),
              ],

              // TENGAH (WAJIB ADA)
              Expanded(
                child: panel(
                  Colors.deepPurple,
                  "PLAYER CORE",
                ),
              ),

              // KANAN
              if (!compact) ...[
                const SizedBox(width: 8),

                Expanded(
                  child: Column(
                    children: [
                      Expanded(
                        child: panel(
                          Colors.grey,
                          "Top Right",
                        ),
                      ),

                      const SizedBox(height: 8),

                      Expanded(
                        child: panel(
                          Colors.purple,
                          "Bottom Right",
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget panel(
    Color color,
    String title,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(24),
      ),

      child: Center(
        child: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}