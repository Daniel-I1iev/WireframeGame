import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import spline from "./spline.js";
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.setPixelRatio(window.devicePixelRatio * 1.5);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'gameover', 'win'
let score = 0;
let health = 100;
let boxes = []; // Array to store box objects for collision detection
let barriers = []; // Array to store barrier objects
let tubeLines; // Reference to the tube lines for background
let wireframeColor = 0xff0000; // Default red color

// UI elements
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.left = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
scoreElement.style.display = 'none'; // Hidden initially
document.body.appendChild(scoreElement);

// Health display
const healthElement = document.createElement('div');
healthElement.style.position = 'absolute';
healthElement.style.top = '60px';
healthElement.style.left = '20px';
healthElement.style.width = '200px';
healthElement.style.height = '20px';
healthElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
healthElement.style.border = '2px solid white';
healthElement.style.borderRadius = '10px';
healthElement.style.display = 'none'; // Hidden initially
document.body.appendChild(healthElement);

// Health bar fill
const healthBarFill = document.createElement('div');
healthBarFill.style.width = '100%';
healthBarFill.style.height = '100%';
healthBarFill.style.backgroundColor = 'lime';
healthBarFill.style.borderRadius = '8px';
healthBarFill.style.transition = 'width 0.3s ease, background-color 0.3s ease';
healthElement.appendChild(healthBarFill);

// Start menu
const menuContainer = document.createElement('div');
menuContainer.style.position = 'absolute';
menuContainer.style.top = '0';
menuContainer.style.left = '0';
menuContainer.style.width = '100%';
menuContainer.style.height = '100%';
menuContainer.style.display = 'flex';
menuContainer.style.flexDirection = 'column';
menuContainer.style.justifyContent = 'center';
menuContainer.style.alignItems = 'center';
menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
document.body.appendChild(menuContainer);

const titleElement = document.createElement('h1');
titleElement.textContent = 'WIREFRAME FLYTHROUGH';
titleElement.style.color = 'white';
titleElement.style.fontSize = '48px';
titleElement.style.fontFamily = 'Arial, sans-serif';
titleElement.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
titleElement.style.marginBottom = '50px';
menuContainer.appendChild(titleElement);

// Color picker button
const colorPickerButton = document.createElement('button');
colorPickerButton.textContent = 'CHANGE WIREFRAME COLOR';
colorPickerButton.style.padding = '15px 40px';
colorPickerButton.style.fontSize = '24px';
colorPickerButton.style.fontFamily = 'Arial, sans-serif';
colorPickerButton.style.backgroundColor = '#ff0000';
colorPickerButton.style.color = 'white';
colorPickerButton.style.border = 'none';
colorPickerButton.style.borderRadius = '5px';
colorPickerButton.style.cursor = 'pointer';
colorPickerButton.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
colorPickerButton.style.transition = 'all 0.3s ease';
colorPickerButton.style.marginBottom = '30px';
menuContainer.appendChild(colorPickerButton);

// Color popup
const colorPopup = document.createElement('div');
colorPopup.style.position = 'absolute';
colorPopup.style.top = '0';
colorPopup.style.left = '0';
colorPopup.style.transform = 'translate(-50%, -50%)';
colorPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
colorPopup.style.color = 'white';
colorPopup.style.padding = '20px';
colorPopup.style.borderRadius = '10px';
colorPopup.style.fontSize = '24px';
colorPopup.style.fontFamily = 'Arial, sans-serif';
colorPopup.style.textAlign = 'center';
colorPopup.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
colorPopup.style.display = 'none';
colorPopup.style.zIndex = '1000';
document.body.appendChild(colorPopup);

// Color name display
const colorNameDisplay = document.createElement('div');
colorNameDisplay.style.marginBottom = '15px';
colorPopup.appendChild(colorNameDisplay);

// Color swatch
const colorSwatch = document.createElement('div');
colorSwatch.style.width = '100px';
colorSwatch.style.height = '100px';
colorSwatch.style.margin = '0 auto 15px';
colorSwatch.style.borderRadius = '10px';
colorSwatch.style.border = '2px solid white';
colorPopup.appendChild(colorSwatch);

// Color picker button hover effects
colorPickerButton.addEventListener('mouseover', () => {
  colorPickerButton.style.transform = 'scale(1.1)';
  colorPickerButton.style.boxShadow = '0 0 15px #ff0000, 0 0 30px #ff0000';
});

colorPickerButton.addEventListener('mouseout', () => {
  colorPickerButton.style.transform = 'scale(1)';
  colorPickerButton.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
});

// Color picker button click handler
colorPickerButton.addEventListener('click', () => {
  // Generate a random color
  const randomColor = new THREE.Color();
  randomColor.setHSL(Math.random(), 1, 0.5);
  wireframeColor = randomColor.getHex();
  
  // Update the wireframe color
  if (tubeLines && tubeLines.material) {
    tubeLines.material.color.setHex(wireframeColor);
  }
  
  // Update the color popup
  colorNameDisplay.textContent = `Selected Color: ${getColorName(wireframeColor)}`;
  colorSwatch.style.backgroundColor = `#${wireframeColor.toString(16).padStart(6, '0')}`;
  
  // Position the popup well above the title
  const titleRect = titleElement.getBoundingClientRect();
  colorPopup.style.top = `${titleRect.top - 120}px`;
  colorPopup.style.left = `${titleRect.left + titleRect.width / 2}px`;
  
  // Show the popup
  colorPopup.style.display = 'block';
  
  // Update the title shadow to match the new color
  titleElement.style.textShadow = `0 0 10px #${wireframeColor.toString(16).padStart(6, '0')}, 0 0 20px #${wireframeColor.toString(16).padStart(6, '0')}`;
  
  // Hide the popup after 1 second
  setTimeout(() => {
    colorPopup.style.display = 'none';
  }, 1000);
});

// Function to get a color name from a hex value
function getColorName(hex) {
  const color = new THREE.Color(hex);
  const hsl = {};
  color.getHSL(hsl);
  
  // Convert HSL to a color name
  const hue = hsl.h * 360;
  const saturation = hsl.s * 100;
  const lightness = hsl.l * 100;
  
  if (saturation < 15) {
    if (lightness < 20) return 'Black';
    if (lightness > 80) return 'White';
    return 'Gray';
  }
  
  if (hue >= 0 && hue < 30) return 'Red';
  if (hue >= 30 && hue < 60) return 'Orange';
  if (hue >= 60 && hue < 90) return 'Yellow';
  if (hue >= 90 && hue < 150) return 'Green';
  if (hue >= 150 && hue < 210) return 'Cyan';
  if (hue >= 210 && hue < 270) return 'Blue';
  if (hue >= 270 && hue < 330) return 'Purple';
  if (hue >= 330 && hue < 360) return 'Pink';
  
  return 'Unknown';
}

const startButton = document.createElement('button');
startButton.textContent = 'START';
startButton.style.padding = '15px 40px';
startButton.style.fontSize = '24px';
startButton.style.fontFamily = 'Arial, sans-serif';
startButton.style.backgroundColor = '#ff0000';
startButton.style.color = 'white';
startButton.style.border = 'none';
startButton.style.borderRadius = '5px';
startButton.style.cursor = 'pointer';
startButton.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
startButton.style.transition = 'all 0.3s ease';
menuContainer.appendChild(startButton);

// Game over screen
const gameOverContainer = document.createElement('div');
gameOverContainer.style.position = 'absolute';
gameOverContainer.style.top = '0';
gameOverContainer.style.left = '0';
gameOverContainer.style.width = '100%';
gameOverContainer.style.height = '100%';
gameOverContainer.style.display = 'none';
gameOverContainer.style.flexDirection = 'column';
gameOverContainer.style.justifyContent = 'center';
gameOverContainer.style.alignItems = 'center';
gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
document.body.appendChild(gameOverContainer);

const gameOverTitle = document.createElement('h1');
gameOverTitle.textContent = 'GAME OVER';
gameOverTitle.style.color = 'white';
gameOverTitle.style.fontSize = '48px';
gameOverTitle.style.fontFamily = 'Arial, sans-serif';
gameOverTitle.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
gameOverTitle.style.marginBottom = '20px';
gameOverContainer.appendChild(gameOverTitle);

const finalScoreElement = document.createElement('div');
finalScoreElement.style.color = 'white';
finalScoreElement.style.fontSize = '24px';
finalScoreElement.style.fontFamily = 'Arial, sans-serif';
finalScoreElement.style.marginBottom = '50px';
gameOverContainer.appendChild(finalScoreElement);

const tryAgainButton = document.createElement('button');
tryAgainButton.textContent = 'TRY AGAIN';
tryAgainButton.style.padding = '15px 40px';
tryAgainButton.style.fontSize = '24px';
tryAgainButton.style.fontFamily = 'Arial, sans-serif';
tryAgainButton.style.backgroundColor = '#ff0000';
tryAgainButton.style.color = 'white';
tryAgainButton.style.border = 'none';
tryAgainButton.style.borderRadius = '5px';
tryAgainButton.style.cursor = 'pointer';
tryAgainButton.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
tryAgainButton.style.transition = 'all 0.3s ease';
gameOverContainer.appendChild(tryAgainButton);

// Win screen
const winContainer = document.createElement('div');
winContainer.style.position = 'absolute';
winContainer.style.top = '0';
winContainer.style.left = '0';
winContainer.style.width = '100%';
winContainer.style.height = '100%';
winContainer.style.display = 'none';
winContainer.style.flexDirection = 'column';
winContainer.style.justifyContent = 'center';
winContainer.style.alignItems = 'center';
winContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
document.body.appendChild(winContainer);

const winTitle = document.createElement('h1');
winTitle.textContent = 'CONGRATULATIONS!';
winTitle.style.color = 'white';
winTitle.style.fontSize = '48px';
winTitle.style.fontFamily = 'Arial, sans-serif';
winTitle.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
winTitle.style.marginBottom = '20px';
winContainer.appendChild(winTitle);

const winMessage = document.createElement('div');
winMessage.textContent = 'YOU WON!';
winMessage.style.color = 'white';
winMessage.style.fontSize = '36px';
winMessage.style.fontFamily = 'Arial, sans-serif';
winMessage.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
winMessage.style.marginBottom = '20px';
winContainer.appendChild(winMessage);

const winScoreElement = document.createElement('div');
winScoreElement.style.color = 'white';
winScoreElement.style.fontSize = '24px';
winScoreElement.style.fontFamily = 'Arial, sans-serif';
winScoreElement.style.marginBottom = '50px';
winContainer.appendChild(winScoreElement);

const playAgainButton = document.createElement('button');
playAgainButton.textContent = 'PLAY AGAIN';
playAgainButton.style.padding = '15px 40px';
playAgainButton.style.fontSize = '24px';
playAgainButton.style.fontFamily = 'Arial, sans-serif';
playAgainButton.style.backgroundColor = '#00ff00';
playAgainButton.style.color = 'white';
playAgainButton.style.border = 'none';
playAgainButton.style.borderRadius = '5px';
playAgainButton.style.cursor = 'pointer';
playAgainButton.style.boxShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
playAgainButton.style.transition = 'all 0.3s ease';
winContainer.appendChild(playAgainButton);

// Button hover effects
startButton.addEventListener('mouseover', () => {
  startButton.style.transform = 'scale(1.1)';
  startButton.style.boxShadow = '0 0 15px #ff0000, 0 0 30px #ff0000';
});

startButton.addEventListener('mouseout', () => {
  startButton.style.transform = 'scale(1)';
  startButton.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
});

tryAgainButton.addEventListener('mouseover', () => {
  tryAgainButton.style.transform = 'scale(1.1)';
  tryAgainButton.style.boxShadow = '0 0 15px #ff0000, 0 0 30px #ff0000';
});

tryAgainButton.addEventListener('mouseout', () => {
  tryAgainButton.style.transform = 'scale(1)';
  tryAgainButton.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
});

playAgainButton.addEventListener('mouseover', () => {
  playAgainButton.style.transform = 'scale(1.1)';
  playAgainButton.style.boxShadow = '0 0 15px #00ff00, 0 0 30px #00ff00';
});

playAgainButton.addEventListener('mouseout', () => {
  playAgainButton.style.transform = 'scale(1)';
  playAgainButton.style.boxShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
});

// Button click handlers
startButton.addEventListener('click', startGame);
tryAgainButton.addEventListener('click', startGame);
playAgainButton.addEventListener('click', startGame);

// Player movement variables
const moveSpeed = 0.03;
const pathSpeed = 0.0001;
const returnToCenterSpeed = 0.01;
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  arrowup: false,
  arrowdown: false,
  arrowleft: false,
  arrowright: false
};

// Player position tracking
let playerOffset = new THREE.Vector3(0, 0, 0);
let pathProgress = 0;
let invincible = false;
let invincibleTime = 0;

// Collision detection variables
const playerRadius = 0.3;
const boxRadius = 0.075;
const barrierRadius = 0.15; // Size of the octahedron
const collisionThreshold = 0.92; // Increased from 0.85 for more accurate collisions
const nonCollidingAxisTolerance = 0.35; // Reduced from 0.4 for stricter collision detection

// Disable OrbitControls since we're using WASD
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.03;

// post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0.001;
bloomPass.strength = 4.0;
bloomPass.radius = 0.1;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// create a line geometry from the spline
const points = spline.getPoints(200);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const line = new THREE.Line(geometry, material);
// scene.add(line);

// create a tube geometry from the spline
const tubeGeo = new THREE.TubeGeometry(spline, 444, 0.65, 32, true);

// create edges geometry from the spline
const edges = new THREE.EdgesGeometry(tubeGeo, 0.1);
const lineMat = new THREE.LineBasicMaterial({ color: wireframeColor });
tubeLines = new THREE.LineSegments(edges, lineMat);
scene.add(tubeLines);

// Create collectible boxes
const numBoxes = 55;
const size = 0.075;
const boxGeo = new THREE.BoxGeometry(size, size, size);

for (let i = 0; i < numBoxes; i += 1) {
  const boxMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true
  });
  const box = new THREE.Mesh(boxGeo, boxMat);
  const p = (i / numBoxes + Math.random() * 0.1) % 1;
  const pos = tubeGeo.parameters.path.getPointAt(p);
  pos.x += Math.random() - 0.4;
  pos.z += Math.random() - 0.4;
  box.position.copy(pos);
  const rote = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  box.rotation.set(rote.x, rote.y, rote.z);
  const edges = new THREE.EdgesGeometry(boxGeo, 0.2);
  const color = new THREE.Color().setHSL(0.7 - p, 1, 0.5);
  const lineMat = new THREE.LineBasicMaterial({ color });
  const boxLines = new THREE.LineSegments(edges, lineMat);
  boxLines.position.copy(pos);
  boxLines.rotation.set(rote.x, rote.y, rote.z);
  // scene.add(box);
  scene.add(boxLines);
  
  // Store box data for collision detection
  boxes.push({
    mesh: boxLines,
    position: pos.clone(),
    collected: false,
    rotation: rote.clone()
  });
}

// Create barriers
const numBarriers = 15;

for (let i = 0; i < numBarriers; i += 1) {
  // Create a barrier with a different shape (octahedron)
  const barrierGeo = new THREE.OctahedronGeometry(0.15, 0);
  const barrierMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  });
  const barrier = new THREE.Mesh(barrierGeo, barrierMat);
  
  // Position the barrier along the path
  const p = (i / numBarriers + Math.random() * 0.1) % 1;
  const pos = tubeGeo.parameters.path.getPointAt(p);
  pos.x += Math.random() - 0.4;
  pos.z += Math.random() - 0.4;
  barrier.position.copy(pos);
  
  // Random rotation
  const rote = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  barrier.rotation.set(rote.x, rote.y, rote.z);
  
  // Create wireframe edges
  const edges = new THREE.EdgesGeometry(barrierGeo, 0.2);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const barrierLines = new THREE.LineSegments(edges, lineMat);
  barrierLines.position.copy(pos);
  barrierLines.rotation.set(rote.x, rote.y, rote.z);
  
  scene.add(barrierLines);
  
  // Store barrier data for collision detection
  barriers.push({
    mesh: barrierLines,
    position: pos.clone(),
    hit: false,
    rotation: rote.clone(),
    size: 0.15, // Store the actual size for more accurate collision detection
    vertices: barrierGeo.vertices || [] // Store vertices if available
  });
}

// Set initial camera position
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// Handle keyboard input
window.addEventListener('keydown', (e) => {
  if (gameState !== 'playing') return;
  
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'arrowup') keys.arrowup = true;
  if (key === 'a' || key === 'arrowleft') keys.arrowleft = true;
  if (key === 's' || key === 'arrowdown') keys.arrowdown = true;
  if (key === 'd' || key === 'arrowright') keys.arrowright = true;
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'arrowup') keys.arrowup = false;
  if (key === 'a' || key === 'arrowleft') keys.arrowleft = false;
  if (key === 's' || key === 'arrowdown') keys.arrowdown = false;
  if (key === 'd' || key === 'arrowright') keys.arrowright = false;
});

// Initialize game objects
function initializeGameObjects() {
  // Clear existing objects
  boxes.forEach(box => {
    if (box.mesh) scene.remove(box.mesh);
  });
  boxes = [];
  
  barriers.forEach(barrier => {
    if (barrier.mesh) scene.remove(barrier.mesh);
  });
  barriers = [];
  
  // Create collectible boxes
  const numBoxes = 55;
  const size = 0.075;
  const boxGeo = new THREE.BoxGeometry(size, size, size);
  
  for (let i = 0; i < numBoxes; i += 1) {
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    const p = (i / numBoxes + Math.random() * 0.1) % 1;
    const pos = tubeGeo.parameters.path.getPointAt(p);
    pos.x += Math.random() - 0.4;
    pos.z += Math.random() - 0.4;
    box.position.copy(pos);
    const rote = new THREE.Vector3(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    box.rotation.set(rote.x, rote.y, rote.z);
    const edges = new THREE.EdgesGeometry(boxGeo, 0.2);
    const color = new THREE.Color().setHSL(0.7 - p, 1, 0.5);
    const lineMat = new THREE.LineBasicMaterial({ color });
    const boxLines = new THREE.LineSegments(edges, lineMat);
    boxLines.position.copy(pos);
    boxLines.rotation.set(rote.x, rote.y, rote.z);
    scene.add(boxLines);
    
    // Store box data for collision detection
    boxes.push({
      mesh: boxLines,
      position: pos.clone(),
      collected: false,
      rotation: rote.clone()
    });
  }
  
  // Create barriers
  const numBarriers = 15;
  
  for (let i = 0; i < numBarriers; i += 1) {
    // Create a barrier with a different shape (octahedron)
    const barrierGeo = new THREE.OctahedronGeometry(0.15, 0);
    const barrierMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true
    });
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    
    // Position the barrier along the path
    const p = (i / numBarriers + Math.random() * 0.1) % 1;
    const pos = tubeGeo.parameters.path.getPointAt(p);
    pos.x += Math.random() - 0.4;
    pos.z += Math.random() - 0.4;
    barrier.position.copy(pos);
    
    // Random rotation
    const rote = new THREE.Vector3(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    barrier.rotation.set(rote.x, rote.y, rote.z);
    
    // Create wireframe edges
    const edges = new THREE.EdgesGeometry(barrierGeo, 0.2);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const barrierLines = new THREE.LineSegments(edges, lineMat);
    barrierLines.position.copy(pos);
    barrierLines.rotation.set(rote.x, rote.y, rote.z);
    
    scene.add(barrierLines);
    
    // Store barrier data for collision detection
    barriers.push({
      mesh: barrierLines,
      position: pos.clone(),
      hit: false,
      rotation: rote.clone(),
      size: 0.15, // Store the actual size for more accurate collision detection
      vertices: barrierGeo.vertices || [] // Store vertices if available
    });
  }
}

// Start game function
function startGame() {
  // Reset game state
  gameState = 'playing';
  score = 0;
  health = 100;
  pathProgress = 0;
  playerOffset = new THREE.Vector3(0, 0, 0);
  invincible = false;
  invincibleTime = 0;
  
  // Initialize game objects
  initializeGameObjects();
  
  // Update UI
  updateScoreDisplay();
  updateHealthDisplay();
  
  // Show game UI, hide menus
  scoreElement.style.display = 'block';
  healthElement.style.display = 'block';
  menuContainer.style.display = 'none';
  gameOverContainer.style.display = 'none';
  winContainer.style.display = 'none';
  colorPopup.style.display = 'none';
  
  // Reset camera position
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
}

// Game over function
function gameOver() {
  gameState = 'gameover';
  
  // Update UI
  scoreElement.style.display = 'none';
  healthElement.style.display = 'none';
  finalScoreElement.textContent = `Final Score: ${score}`;
  gameOverContainer.style.display = 'flex';
}

// Win function
function winGame() {
  gameState = 'win';
  
  // Update UI
  scoreElement.style.display = 'none';
  healthElement.style.display = 'none';
  winScoreElement.textContent = `Final Score: ${score}`;
  winContainer.style.display = 'flex';
  
  // Visual celebration effect
  document.body.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
  setTimeout(() => {
    document.body.style.backgroundColor = 'transparent';
  }, 500);
}

// Update player position based on keyboard input
function updatePlayerPosition() {
  if (gameState !== 'playing') return;
  
  // Update path progress (automatic movement)
  pathProgress += pathSpeed;
  if (pathProgress > 1) pathProgress = 0;
  
  // Get current position on the path
  const currentPoint = tubeGeo.parameters.path.getPointAt(pathProgress);
  const nextPoint = tubeGeo.parameters.path.getPointAt((pathProgress + 0.01) % 1);
  
  // Calculate direction vector
  const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint).normalize();
  
  // Calculate perpendicular vectors for movement
  const right = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  
  // Update player offset based on input (inverted up/down)
  if (keys.arrowup) playerOffset.y -= moveSpeed; // Inverted: up key moves down
  if (keys.arrowdown) playerOffset.y += moveSpeed; // Inverted: down key moves up
  if (keys.arrowleft) playerOffset.x -= moveSpeed;
  if (keys.arrowright) playerOffset.x += moveSpeed;
  
  // Apply return-to-center force when no keys are pressed
  if (!keys.arrowup && !keys.arrowdown) {
    // Gradually return to center vertically
    if (playerOffset.y > 0) {
      playerOffset.y = Math.max(0, playerOffset.y - returnToCenterSpeed);
    } else if (playerOffset.y < 0) {
      playerOffset.y = Math.min(0, playerOffset.y + returnToCenterSpeed);
    }
  }
  
  if (!keys.arrowleft && !keys.arrowright) {
    // Gradually return to center horizontally
    if (playerOffset.x > 0) {
      playerOffset.x = Math.max(0, playerOffset.x - returnToCenterSpeed);
    } else if (playerOffset.x < 0) {
      playerOffset.x = Math.min(0, playerOffset.x + returnToCenterSpeed);
    }
  }
  
  // Limit player offset to stay within tunnel (tighter constraints)
  const maxOffset = 0.35; // Reduced from 0.4 to 0.35 for tighter constraints
  playerOffset.x = Math.max(-maxOffset, Math.min(maxOffset, playerOffset.x));
  playerOffset.y = Math.max(-maxOffset, Math.min(maxOffset, playerOffset.y));
  
  // Calculate final position
  const finalPosition = currentPoint.clone();
  finalPosition.add(right.multiplyScalar(playerOffset.x));
  finalPosition.add(up.multiplyScalar(playerOffset.y));
  
  // Update camera position
  camera.position.copy(finalPosition);
  
  // Make camera look ahead along the path
  const lookAtPoint = tubeGeo.parameters.path.getPointAt((pathProgress + 0.05) % 1);
  camera.lookAt(lookAtPoint);
  
  // Update invincibility timer
  if (invincible) {
    invincibleTime--;
    if (invincibleTime <= 0) {
      invincible = false;
    }
  }
}

// Improved collision detection between player and boxes
function checkCollisions() {
  if (gameState !== 'playing') return;
  
  // Check collisions with collectible boxes
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (!box.collected) {
      const distance = camera.position.distanceTo(box.position);
      
      if (distance < playerRadius + boxRadius) {
        const directionToPlayer = new THREE.Vector3()
          .subVectors(camera.position, box.position)
          .normalize();
        
        const boxRight = new THREE.Vector3(1, 0, 0).applyEuler(box.rotation);
        const boxUp = new THREE.Vector3(0, 1, 0).applyEuler(box.rotation);
        const boxForward = new THREE.Vector3(0, 0, 1).applyEuler(box.rotation);
        
        const rightProjection = Math.abs(directionToPlayer.dot(boxRight));
        const upProjection = Math.abs(directionToPlayer.dot(boxUp));
        const forwardProjection = Math.abs(directionToPlayer.dot(boxForward));
        
        const isOnSurface = 
          (rightProjection > 0.9 && upProjection < 0.5 && forwardProjection < 0.5) ||
          (upProjection > 0.9 && rightProjection < 0.5 && forwardProjection < 0.5) ||
          (forwardProjection > 0.9 && rightProjection < 0.5 && upProjection < 0.5);
        
        if (isOnSurface) {
          box.collected = true;
          scene.remove(box.mesh);
          score += 10;
          updateScoreDisplay();
          
          if (score >= 200) {
            winGame();
          }
        }
      }
    }
  }
  
  // Check collisions with barriers
  if (!invincible) {
    for (let i = 0; i < barriers.length; i++) {
      const barrier = barriers[i];
      if (!barrier.hit) {
        const distance = camera.position.distanceTo(barrier.position);
        
        if (distance < playerRadius + barrier.size) {
          const directionToPlayer = new THREE.Vector3()
            .subVectors(camera.position, barrier.position)
            .normalize();
          
          const barrierRight = new THREE.Vector3(1, 0, 0).applyEuler(barrier.rotation);
          const barrierUp = new THREE.Vector3(0, 1, 0).applyEuler(barrier.rotation);
          const barrierForward = new THREE.Vector3(0, 0, 1).applyEuler(barrier.rotation);
          
          const rightProjection = Math.abs(directionToPlayer.dot(barrierRight));
          const upProjection = Math.abs(directionToPlayer.dot(barrierUp));
          const forwardProjection = Math.abs(directionToPlayer.dot(barrierForward));
          
          // Surface detection for octahedron barriers
          const isOnSurface = 
            (rightProjection > collisionThreshold && upProjection < nonCollidingAxisTolerance && forwardProjection < nonCollidingAxisTolerance) ||
            (upProjection > collisionThreshold && rightProjection < nonCollidingAxisTolerance && forwardProjection < nonCollidingAxisTolerance) ||
            (forwardProjection > collisionThreshold && rightProjection < nonCollidingAxisTolerance && upProjection < nonCollidingAxisTolerance) ||
            (rightProjection > 0.75 && upProjection > 0.75 && forwardProjection < 0.25) ||
            (rightProjection > 0.75 && forwardProjection > 0.75 && upProjection < 0.25) ||
            (upProjection > 0.75 && forwardProjection > 0.75 && rightProjection < 0.25);
          
          // Distance check to prevent false positives
          const isCloseToSurface = distance < playerRadius + barrier.size * 0.9;
          
          if (isOnSurface && isCloseToSurface) {
            barrier.hit = true;
            health -= 20;
            if (health < 0) health = 0;
            updateHealthDisplay();
            
            invincible = true;
            invincibleTime = 60;
            
            document.body.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            setTimeout(() => {
              document.body.style.backgroundColor = 'transparent';
            }, 300);
            
            // Camera shake effect
            const originalPosition = camera.position.clone();
            const shakeIntensity = 0.05;
            const shakeDuration = 10;
            let shakeFrame = 0;
            
            const shakeCamera = () => {
              if (shakeFrame < shakeDuration) {
                camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
                camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
                camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
                shakeFrame++;
                requestAnimationFrame(shakeCamera);
              } else {
                camera.position.copy(originalPosition);
              }
            };
            
            shakeCamera();
            
            if (health <= 0) {
              gameOver();
            }
          }
        }
      }
    }
  }
}

function updateScoreDisplay() {
  scoreElement.textContent = `Score: ${score}`;
}

function updateHealthDisplay() {
  const healthPercentage = (health / 100) * 100;
  healthBarFill.style.width = `${healthPercentage}%`;
  
  if (health > 60) {
    healthBarFill.style.backgroundColor = 'lime';
  } else if (health > 30) {
    healthBarFill.style.backgroundColor = 'yellow';
  } else {
    healthBarFill.style.backgroundColor = 'red';
  }
}

function animate(t = 0) {
  requestAnimationFrame(animate);
  updatePlayerPosition();
  checkCollisions();
  composer.render(scene, camera);
}
animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio * 1.5);
  composer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);