import React from 'react'
import styled from 'styled-components'
import _map from 'lodash/map'
import _size from 'lodash/size'
import { getAssetSrc } from '../../utils/contentful/helpers'

import media from '../../styles/media'

const Wrapper = styled.div`
  /* background-image: url("${(props) => props.src}");
	background-position: center top; */
	background-color: ${(props) => props.backgroundColor};
  
  min-height: 100px;
  height: 393.024px;
	overflow: hidden;
	${media.greaterThan('tablet')`
		width: 100%;
	`};
	${media.greaterThan('desktop')`
		width: 83%;
		margin: 0 0 0 auto;	
	`};
`

const IconsWrapper = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	align-items: center;
`

const Icon = styled.img`
	width: auto;
	height: 100px;
`

const Hero = ({ imageUrl, bannerIcons, backgroundColor }) => (
	<Wrapper src={imageUrl} backgroundColor={backgroundColor}>
		{_size(bannerIcons) > 0 && (
			<IconsWrapper>
				{_map(bannerIcons, (icon, index) => {
					return <Icon key={index} src={getAssetSrc(icon)} />
				})}
			</IconsWrapper>
		)}
	</Wrapper>
)

export default Hero
