import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import _get from 'lodash/get'
import _map from 'lodash/map'
import _random from 'lodash/random'

import useMedia from '../../hooks/useMedia'
import useMousePosition from '../../hooks/useMousePosition'

import vars from '../../styles/vars'
import Surface from './../../assets/surface.svg'

const CubeContainer = styled.div`
	width: 100%;
	height: calc(100vh - (2 * ${vars.sideWidth.desktop}));
	display: flex;
	align-items: center;
	justify-content: center;
`

const CubeWrapper = styled.div`z-index: 1;`

const lineGrow = keyframes`
	from { stroke-dashoffset: 1000; }
	to { stroke-dashoffset: 0; }
`

const CubeSurfaces = styled.div`
	position: relative;
	margin: 0 auto;
	height: ${({ size }) => size}px;
	width: ${({ size }) => size}px;
	/* transition: transform .1s ease-in-out; */
	transform-style: preserve-3d;
	transform: ${({ rotation }) => {
		return css`
				rotateX(${_get(rotation, 'y')}deg)
				rotateY(${_get(rotation, 'x')}deg);
		`
	}};

	> div {
		position: absolute;
		background-color: rgba(0, 0, 0, 0.001);
		/* border: 1px solid rgba(0, 0, 0, 0.1); */
		overflow: hidden;

		${({ size }) => css`
			height: ${size}px;
			width: ${size}px;
			&:nth-child(1) {
				transform: rotateX(90deg) translateZ(${size / 2}px);
			}
			&:nth-child(2) {
				transform: translateZ(${size / 2}px);
			}
			&:nth-child(3) {
				transform: rotateY(90deg) translateZ(${size / 2}px);
			}
			&:nth-child(4) {
				transform: rotateY(180deg) translateZ(${size / 2}px);
			}
			&:nth-child(5) {
				transform: rotateY(-90deg) translateZ(${size / 2}px);
			}
			&:nth-child(6) {
				transform: rotateX(-90deg) translateZ(${size / 2}px) rotate(180deg);
			}
		`};
		> svg {
			width: 100%;
			height: 100%;
		}
		.line {
			stroke-width: 1;
			/* stroke-dasharray: 1000;
			stroke-dashoffset: 1000; */
			/* animation: ${lineGrow} ${_random(2, 10)}s linear alternate infinite; */
		}
	}
`

const Cube = () => {
	const { position, rotation } = useMousePosition()
	const surfaces = [ 'one', 'two', 'three', 'four', 'five', 'six' ]
	const media = useMedia()

	return (
		<CubeContainer>
			<CubeWrapper>
				<CubeSurfaces size={360} rotation={rotation}>
					{_map(surfaces, (surface) => {
						return (
							<div key={surface} className={`face ${surface}`}>
								<Surface />
							</div>
						)
					})}
				</CubeSurfaces>
			</CubeWrapper>
		</CubeContainer>
	)
}

export default Cube
