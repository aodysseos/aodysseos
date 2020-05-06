import { documentToReactComponents } from '@contentful/rich-text-react-renderer'

import options from './options'

const RichTextRenderer = (document) => {
	return documentToReactComponents(document, options)
}

export default RichTextRenderer
