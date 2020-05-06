import React from 'react'
import styled from 'styled-components'

import Gist from 'react-gist'

const IframeContainer = styled.div`
	position: relative;
	overflow: hidden;
	width: 100%;
	height: auto;
	& iframe {
		width: 100%;
		height: 500px;
		border: 0;
		overflow: hidden;
	}
`
const Codesandbox = ({ type, title, uri }) => (
	<IframeContainer>
		<iframe
			src={uri}
			title={title}
			allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr"
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	</IframeContainer>
)

const CodeSnippet = ({ type, ...rest }) =>
	({
		codesandbox: <Codesandbox {...rest} />,
		gist: <Gist {...rest} />
	}[type] || <div {...rest} />)

export default CodeSnippet
