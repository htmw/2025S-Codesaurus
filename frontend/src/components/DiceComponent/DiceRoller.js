import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

const DiceModel = ({ rolling, targetRotation, onClick }) => {
	const diceRef = useRef();
	const { scene } = useGLTF('/models/dice.glb');

	useFrame(() => {
		if (!diceRef.current) return;

		if (rolling) {
			diceRef.current.rotation.x += 0.05;
			diceRef.current.rotation.y += 0.05;
		} else if (targetRotation) {
			diceRef.current.rotation.x = targetRotation.x;
			diceRef.current.rotation.y = targetRotation.y;
			diceRef.current.rotation.z = targetRotation.z || 0;
		}
	});

	scene.traverse((child) => {
		if (child.isMesh) {
			child.cursor = 'pointer';
			child.onClick = onClick;
		}
	});

	return (
		<primitive
			object={scene}
			ref={diceRef}
			scale={50} // Adjust scale if needed
			onClick={onClick}
			position={[0, 0, 0]}
			castShadow
			receiveShadow
		/>
	);
};

const faceRotations = {
	1: { x: Math.PI / 2, y: 0, z: 0 },
	2: { x: Math.PI, y: 0, z: 0 },
	3: { x: 0, y: Math.PI / 2, z: 0 },
	4: { x: 0, y: -Math.PI / 2, z: 0 },
	5: { x: 0, y: 0, z: 0 },
	6: { x: -Math.PI / 2, y: 0, z: 0 },
};

const DiceRoller = ({ value = 1, rolling = false, onRoll, size = 30 }) => {
	return (
		<Canvas
			style={{ width: `${size}px`, height: `${size}px`, cursor: rolling ? 'not-allowed' : 'pointer' }}
			camera={{ position: [0, 0, 2.2], fov: 40 }}
			shadows
		>
			<ambientLight intensity={0.4} />
			<directionalLight position={[5, 5, 5]} castShadow />
			<OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
			<DiceModel
				rolling={rolling}
				targetRotation={rolling ? null : faceRotations[value]}
				onClick={() => !rolling && onRoll?.()}
			/>
		</Canvas>
	);
};

export default DiceRoller;
