import React from 'react'
import styled from 'styled-components'

import Position from './Position'

import vars from '../styles/vars'

const Wrapper = styled.div`
	width: 100%;
	height: ${vars.sideWidth.desktop};
	display: flex;
	justify-content: center;
	align-items: flex-end;
	padding: 20px 0;
	background-color: ${({ theme }) => theme.background};
`

const Footer = () => (
	<Wrapper>
		<Position />
	</Wrapper>
)

export default Footer
