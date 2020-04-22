import { documentToReactComponents } from '@contentful/rich-text-react-renderer'

import options from './options'

const RichTextRenderer = (content) => {
	return documentToReactComponents(content, options)
}

export default RichTextRenderer
