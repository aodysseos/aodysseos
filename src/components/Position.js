import React from 'react'
import styled from 'styled-components'
import { useMousePosition } from '../hooks/useMousePosition'

const Wrapper = styled.div`
	font-family: "Montserrat";
	font-size: 13px;
	font-weight: 800;
	text-align: center;
	text-transform: uppercase;
	color: ${({ theme }) => theme.primary};
`

const Position = () => {
	const { position, rotation } = useMousePosition()
	return <Wrapper>{`x: ${position.x} : ${rotation.x} y: ${position.y} : ${rotation.y}`}</Wrapper>
}

export default Position
