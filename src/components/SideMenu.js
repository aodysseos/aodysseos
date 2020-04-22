import React from 'react'
import AniLink from 'gatsby-plugin-transition-link/AniLink'
import styled, { css } from 'styled-components'
import _map from 'lodash/map'

import vars from '../styles/vars'

const Wrapper = styled.div`
	width: ${vars.sideWidth.sm}px;
	height: 100%;
	position: fixed;
	top: 0;
	${({ position }) => {
		return position === 'left'
			? css`
					left: 10px;
					transform: rotate(180deg);
				`
			: css`
					right: 10px;
				`
	}};
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
	z-index: 9;
	/* background-color: rgba(0, 0, 0, 0.1); */
`

const List = styled.ul`list-style-type: none;`

const Item = styled.li`
	position: relative;
	pointer-events: auto;
	vertical-align: baseline;

	> a {
		font-family: "Montserrat";
		font-size: 13px;
		writing-mode: vertical-lr;
		padding: 10px 20px;
		> span {
			position: relative;
			color: ${(props) => props.theme.primary};
			&::after {
				content: "";
				position: absolute;
				bottom: 0;
				left: 0;
				height: 100%;
				width: 1px;
				background-color: ${(props) => props.theme.primary};
				transform: scaleY(0);
				transform-origin: bottom left;
				transition: transform .3s ease-out, -webkit-transform .3s ease-out;
				will-change: transform;
			}
		}
		&:hover {
			/* color: white;
			text-shadow: rgba(0, 0, 0, 1) 0px 0px 1px; */
			> span {
				&::after {
					transform: scaleY(1);
				}
			}
		}
	}

	&:nth-of-type(1) {
		margin: 5vh 0 17.5vh;
	}

	&:nth-child(2):before {
		content: "";
		position: absolute;
		bottom: calc(100% + 2.5vh);
		left: 50%;
		height: 12.5vh;
		width: 1px;
		background-color: ${(props) => props.theme.primary};
	}
`

const MenuItem = ({ url, name }) => (
	<Item key={name}>
		<AniLink fade to={url}>
			<span>{name}</span>
		</AniLink>
	</Item>
)

const SideMenu = ({ links, position }) => (
	<Wrapper position={position}>
		<List>{_map(links, (item, index) => <MenuItem key={index} {...item} />)}</List>
	</Wrapper>
)

export default SideMenu
