import * as THREE from "three"

// --- CONFIGURATION ---
const L1 = 2.0 // Base height (Joint 1)
const L2 = 3.5 // Shoulder link (Joint 2)
const L3 = 3.0 // Elbow link (Joint 3)

let startTime = 0
let isAnimating = false
let pathPoints = []
let currentS = 0 // The LSPB progress value

// --- 1. LSPB TRAJECTORY LOGIC ---
function getLSPB(t, tf) {
	if (t <= 0) return 0
	if (t >= tf) return 1

	const tb = tf * 0.2 // 20% blend time
	const v_max = 1 / (tf - tb)
	const accel = v_max / tb

	if (t <= tb) return 0.5 * accel * t * t
	if (t <= tf - tb) return (v_max * tb) / 2 + v_max * (t - tb)
	return 1 - 0.5 * accel * Math.pow(tf - t, 2)
}

// --- 2. ANALYTICAL INVERSE KINEMATICS ---
function solveIK(target, joints) {
	const { x, y, z } = target

	// Joint 1: Base Yaw (The fix for stationary base)
	// We rotate the entire base group around the Y-axis
	const theta1 = Math.atan2(z, x)

	// Project to 2D plane (r, h)
	const r = Math.sqrt(x * x + z * z)
	const h = y - L1 // Vertical distance from shoulder joint
	const d = Math.sqrt(r * r + h * h)

	// Reachability check
	if (d > L2 + L3 || d < Math.abs(L2 - L3)) return

	// Joint 3: Elbow Pitch (Law of Cosines)
	const cosTheta3 = (r * r + h * h - L2 * L2 - L3 * L3) / (2 * L2 * L3)
	const theta3 = Math.acos(THREE.MathUtils.clamp(cosTheta3, -1, 1))

	// Joint 2: Shoulder Pitch
	const alpha = Math.atan2(h, r)
	const beta = Math.atan2(L3 * Math.sin(theta3), L2 + L3 * Math.cos(theta3))
	const theta2 = alpha + beta

	// Update the 3D Hierarchy
	joints.base.rotation.y = -theta1 // Yaw
	joints.shoulder.rotation.z = theta2 // Pitch 1
	joints.elbow.rotation.z = -theta3 // Pitch 2
}

// --- 3. SCENE & ROBOT SETUP ---
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222))
scene.add(new THREE.AmbientLight(0xffffff, 0.5))
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(10, 10, 10)
scene.add(light)

function createRobot(isGhost = false) {
	const opacity = isGhost ? 0.3 : 1.0
	const mat = (col) => new THREE.MeshPhongMaterial({ color: col, transparent: isGhost, opacity })

	// Joint 1: Base (Rotation around Y)
	const base = new THREE.Group()
	const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, L1), mat(0x444444))
	baseMesh.position.y = L1 / 2
	base.add(baseMesh)

	// Joint 2: Shoulder (Pivot at top of Base)
	const shoulder = new THREE.Group()
	shoulder.position.y = L1
	base.add(shoulder)

	const l2Mesh = new THREE.Mesh(new THREE.BoxGeometry(L2, 0.3, 0.3), mat(0x00ff88))
	l2Mesh.position.x = L2 / 2
	shoulder.add(l2Mesh)

	// Joint 3: Elbow (Pivot at end of L2)
	const elbow = new THREE.Group()
	elbow.position.x = L2
	shoulder.add(elbow)

	const l3Mesh = new THREE.Mesh(new THREE.BoxGeometry(L3, 0.25, 0.25), mat(0x007bff))
	l3Mesh.position.x = L3 / 2
	elbow.add(l3Mesh)

	const ee = new THREE.Mesh(new THREE.SphereGeometry(0.15), mat(0xffffff))
	ee.position.x = L3
	elbow.add(ee)

	scene.add(base)
	return { base, shoulder, elbow, ee }
}

const mainRobot = createRobot(false)
const ghostRobot = createRobot(true)

// Path Trace Setup
const pathLine = new THREE.Line(
	new THREE.BufferGeometry(),
	new THREE.LineBasicMaterial({ color: 0xffff00 }),
)
scene.add(pathLine)

camera.position.set(10, 10, 12)
camera.lookAt(0, 2, 0)

// --- 4. ANIMATION LOOP ---
document.getElementById("runBtn").onclick = () => {
	startTime = performance.now()
	isAnimating = true
	pathPoints = []
}

function animate() {
	requestAnimationFrame(animate)

	const start = new THREE.Vector3(parseFloat(sx.value), parseFloat(sy.value), parseFloat(sz.value))
	const goal = new THREE.Vector3(parseFloat(gx.value), parseFloat(gy.value), parseFloat(gz.value))
	const tf = parseFloat(duration.value)

	// Update Ghost Arm in real-time to match Goal Sliders
	solveIK(goal, ghostRobot)

	const currentPos = new THREE.Vector3()

	if (isAnimating) {
		const elapsed = (performance.now() - startTime) / 1000
		currentS = getLSPB(elapsed, tf)

		currentPos.lerpVectors(start, goal, currentS)

		// Record path trace
		const eeWorld = new THREE.Vector3()
		mainRobot.ee.getWorldPosition(eeWorld)
		pathPoints.push(eeWorld)
		pathLine.geometry.setFromPoints(pathPoints)

		if (elapsed >= tf) isAnimating = false
	} else {
		// When not animating, stay at start or end depending on last state
		currentPos.lerpVectors(start, goal, currentS)
	}

	solveIK(currentPos, mainRobot)
	renderer.render(scene, camera)
}

animate()
