import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, GestureResponderEvent, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const GRID_SIZE = 15;
const CELL_SIZE = Math.floor(width * 0.9 / GRID_SIZE);
const BOARD_WIDTH = CELL_SIZE * GRID_SIZE;
const BOARD_HEIGHT = CELL_SIZE * GRID_SIZE;

// Available fruits
const FRUITS = [
  require('./assets/fruits/Dango.png'), 
  require('./assets/fruits/BirthdayCake.png'), 
  require('./assets/fruits/Blueberries.png'), 
  require('./assets/fruits/Broccoli.png'), 
  require('./assets/fruits/Corn.png'), 
  require('./assets/fruits/Cupcake.png'), 
  require('./assets/fruits/Doughnut.png'), 
  require('./assets/fruits/Garlic.png'), 
  require('./assets/fruits/Grapes.png'), 
  require('./assets/fruits/Hamburger.png'), 
  require('./assets/fruits/IceCream.png'), 
  require('./assets/fruits/KiwiFruit.png'), 
  require('./assets/fruits/LeafyGreen.png'), 
  require('./assets/fruits/Meat_On_Bone.png'), 
  require('./assets/fruits/Melon.png'), 
  require('./assets/fruits/Olive.png'), 
  require('./assets/fruits/Onion.png'), 
  require('./assets/fruits/Pizza.png'), 
  require('./assets/fruits/Red_Apple.png'), 
];

// Sound effects
const loadSounds = async () => {
  const eatSound = new Audio.Sound();
  const gameOverSound = new Audio.Sound();
  const levelUpSound = new Audio.Sound();

  try {
    await eatSound.loadAsync(require('./assets/eat.mp3'));
    await gameOverSound.loadAsync(require('./assets/game-over.mp3'));
    await levelUpSound.loadAsync(require('./assets/level-up.mp3'));

    return { eatSound, gameOverSound, levelUpSound };
  } catch (error) {
    console.error('Error loading sounds:', error);
    return null;
  }
};

// Types
type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// في بداية الملف، نضيف صور الثعبان
const SNAKE_HEAD = require('./assets/snake/head.png');

export default function App() {
  const [snake, setSnake] = useState<Position[]>([{ x: 5, y: 5 }]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [currentFruit, setCurrentFruit] = useState(FRUITS[Math.floor(Math.random() * FRUITS.length)]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [speed, setSpeed] = useState(200);
  const [startTouch, setStartTouch] = useState<{ x: number; y: number } | null>(null);
  const [sounds, setSounds] = useState<{ eatSound: Audio.Sound; gameOverSound: Audio.Sound; levelUpSound: Audio.Sound; } | null>(null);
  const [waveOffset, setWaveOffset] = useState(0);
  const [snakePoints, setSnakePoints] = useState<Position[]>([]);
  const snakeAnimation = useRef(new Animated.Value(0)).current;

  // Initialize sounds
  useEffect(() => {
    loadSounds().then(loadedSounds => {
      if (loadedSounds) {
        setSounds(loadedSounds);
      }
    });
    return () => {
      if (sounds) {
        sounds.eatSound.unloadAsync();
        sounds.gameOverSound.unloadAsync();
        sounds.levelUpSound.unloadAsync();
      }
    };
  }, []);

  // Generate random food position and fruit
  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    setFood(newFood);
    setCurrentFruit(FRUITS[Math.floor(Math.random() * FRUITS.length)]);
  };

  // Game loop
  useEffect(() => {
    if (!isGameOver) {
      const gameLoop = setInterval(() => {
        moveSnake();
      }, speed);
      return () => clearInterval(gameLoop);
    }
  }, [snake, direction, isGameOver]);

  // Move snake
  const moveSnake = () => {
    const head = snake[0];
    const newHead = { ...head };

    switch (direction) {
      case 'UP':
        newHead.y -= 1;
        break;
      case 'DOWN':
        newHead.y += 1;
        break;
      case 'LEFT':
        newHead.x -= 1;
        break;
      case 'RIGHT':
        newHead.x += 1;
        break;
    }

    // Check collisions
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE ||
      snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
    ) {
      setIsGameOver(true);
      // Play game over sound
      sounds?.gameOverSound.replayAsync();
      return;
    }

    // Check if snake ate food
    const newSnake = [newHead, ...snake];
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(score + 10);
      generateFood();
      // Play eat sound
      sounds?.eatSound.replayAsync();
      // Level up every 50 points
      if (score > 0 && (score + 10) % 50 === 0 && level < 10) {
        setLevel(level + 1);
        setSpeed(speed => Math.max(speed - 20, 50));
        // Play level up sound
        sounds?.levelUpSound.replayAsync();
      }
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  // Reset game
  const resetGame = () => {
    setSnake([{ x: 5, y: 5 }]);
    setDirection('RIGHT');
    setIsGameOver(false);
    setScore(0);
    setLevel(1);
    setSpeed(200);
    generateFood();
  };

  // Handle touch controls
  const handleTouchStart = (event: GestureResponderEvent) => {
    setStartTouch({
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY
    });
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    if (!startTouch) return;

    const endTouch = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY
    };

    const dx = endTouch.x - startTouch.x;
    const dy = endTouch.y - startTouch.y;

    // Determine swipe direction based on the larger movement
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0 && direction !== 'LEFT') {
        setDirection('LEFT');
      } else if (dx < 0 && direction !== 'RIGHT') {
        setDirection('RIGHT');
      }
    } else {
      // Vertical swipe
      if (dy > 0 && direction !== 'UP') {
        setDirection('DOWN');
      } else if (dy < 0 && direction !== 'DOWN') {
        setDirection('UP');
      }
    }

    setStartTouch(null);
  };

  // أضف هذه الدالة لتحديد دوران رأس الثعبان
  const getHeadRotation = (direction: Direction): number => {
    switch (direction) {
      case 'UP':
        return -90;
      case 'RIGHT':
        return 0;
      case 'DOWN':
        return 90;
      case 'LEFT':
        return 180;
    }
  };

  // دوال مساعدة لحساب زوايا الدوران
  const getBodyRotation = (prev: Position, current: Position, next: Position): number => {
    if (prev.x === next.x) return 90; // عمودي
    if (prev.y === next.y) return 0;  // أفقي
    
    // للمنحنيات
    if (prev.x < current.x && current.y < next.y) return 0;
    if (prev.x > current.x && current.y < next.y) return 90;
    if (prev.x < current.x && current.y > next.y) return 270;
    if (prev.x > current.x && current.y > next.y) return 180;
    
    return 0;
  };

  const getTailRotation = (tail: Position, beforeTail: Position): number => {
    if (tail.x < beforeTail.x) return 0;
    if (tail.x > beforeTail.x) return 180;
    if (tail.y < beforeTail.y) return 90;
    return 270;
  };

  // Add this effect after your other useEffect hooks
  useEffect(() => {
    if (!isGameOver) {
      const waveAnimation = setInterval(() => {
        setWaveOffset(prev => (prev + 1) % 360);
      }, 50);
      return () => clearInterval(waveAnimation);
    }
  }, [isGameOver]);

  // Add this new helper function to calculate curve points
  const calculateSnakePoints = (snake: Position[]) => {
    if (snake.length < 2) return [];
    
    let points: Position[] = [];
    for (let i = 0; i < snake.length - 1; i++) {
      const current = snake[i];
      const next = snake[i + 1];
      
      // Add intermediate points for smoother curves
      points.push(current);
      if (i < snake.length - 2) {
        points.push({
          x: (current.x + next.x) / 2,
          y: (current.y + next.y) / 2
        });
      }
    }
    points.push(snake[snake.length - 1]);
    return points;
  };

  // Add this effect to handle snake animation
  useEffect(() => {
    if (!isGameOver) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(snakeAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(snakeAnimation, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [isGameOver]);

  // Update the snake points whenever the snake moves
  useEffect(() => {
    setSnakePoints(calculateSnakePoints(snake));
  }, [snake]);

  return (
    <View 
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <StatusBar style="auto" />
      <Text style={styles.score}>Score: {score} | Level: {level}</Text>
      
      <View style={[styles.board, { width: BOARD_WIDTH, height: BOARD_HEIGHT }]}>
        {/* Snake Body */}
        {snakePoints.map((point, index) => {
          if (index === 0) return null; // Skip the head position

          const animatedStyle = {
            transform: [
              {
                translateY: snakeAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, index % 2 ? 5 : -5, 0],
                })
              },
              {
                scale: snakeAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0.95, 1],
                })
              }
            ]
          };

          return (
            <Animated.View
              key={`body-${index}`}
              style={[
                styles.snakeSegment,
                {
                  left: point.x * CELL_SIZE,
                  top: point.y * CELL_SIZE,
                  width: CELL_SIZE * 1.2,
                  height: CELL_SIZE * 1.2,
                  zIndex: 1,
                },
                animatedStyle
              ]}
            />
          );
        })}

        {/* Snake Head */}
        <View
          style={[
            styles.cell,
            {
              left: snake[0].x * CELL_SIZE,
              top: snake[0].y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              zIndex: 2,
            }
          ]}
        >
          <Image
            source={SNAKE_HEAD}
            style={{
              width: CELL_SIZE * 1.2,
              height: CELL_SIZE * 1.2,
              transform: [
                { rotate: `${getHeadRotation(direction)}deg` }
              ]
            }}
            resizeMode="contain"
          />
        </View>

        {/* Food */}
        <View style={[styles.cell, { 
          left: food.x * CELL_SIZE, 
          top: food.y * CELL_SIZE, 
          width: CELL_SIZE, 
          height: CELL_SIZE 
        }]}>
          <Image 
            source={currentFruit}
            style={{ 
              width: CELL_SIZE * 0.8,
              height: CELL_SIZE * 0.8,
              margin: CELL_SIZE * 0.1
            }}
            resizeMode="contain"
          />
        </View>
      </View>

      {isGameOver && (
        <View style={styles.gameOver}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  board: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible', // للسماح بتأثير الظل
  },
  snake: {
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.5)',
  },
  food: {
    backgroundColor: 'transparent',
  },
  gameOver: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  gameOverText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  snakeSegment: {
    position: 'absolute',
    backgroundColor: '#2ecc71',
    borderRadius: CELL_SIZE,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#27ae60',
    transform: [{ scale: 0.9 }],
  },
});
