/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.module.css';
declare module '*.module.scss';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			[elemName: string]: any
		}
		// Provide Element and other common JSX types using React's types
		type Element = import('react').ReactElement<any, any>
		interface ElementClass {
			render: any
		}
		interface ElementAttributesProperty {
			props: any
		}
		interface ElementChildrenAttribute {
			children: any
		}
	}
}

export {}
