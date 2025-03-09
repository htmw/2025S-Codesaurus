import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Typewriter = ({ text = "", speed = 50, delay = 0 }) => {
	const [displayText, setDisplayText] = useState("");

	useEffect(() => {
		// Reset displayText when the text prop changes
		setDisplayText("");

		let currentIndex = 0;
		const timeout = setTimeout(() => {
			const interval = setInterval(() => {
				if (currentIndex < text.length) {
					// Ensure text[currentIndex] is a valid character
					const char = text[currentIndex] || "";
					setDisplayText((prev) => prev + char);
					currentIndex++;
				} else {
					clearInterval(interval);
				}
			}, speed);

			return () => clearInterval(interval);
		}, delay);

		return () => clearTimeout(timeout);
	}, [text, speed, delay]);

	return (
		<motion.span
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
		>
			{displayText}
		</motion.span>
	);
};

export default Typewriter;