import { useEffect, useState } from 'react'
import useWindowSize from './useWindowSize'

const useMousePosition = () => {
	const [ position, setPosition ] = useState({ x: 1126, y: 599 })
	const [ rotation, setRotation ] = useState({ x: 141, y: 137 })

	const windowSize = useWindowSize()

	useEffect(
		() => {
			const setFromEvent = (e) => {
				setPosition({
					x: e.clientX,
					y: e.clientY
				})
				setRotation({
					x: Math.round(e.clientX * 180 / windowSize.width),
					y: Math.round(e.clientY * 180 / windowSize.height)
				})
			}
			window.addEventListener('mousemove', setFromEvent)

			return () => {
				window.removeEventListener('mousemove', setFromEvent)
			}
		},
		[ windowSize ]
	)

	return { position, rotation }
}

export default useMousePosition
