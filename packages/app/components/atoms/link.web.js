import Link from 'next/link';

export default function ElementLink(props) {
    return (
        <a {...props} >{props.children}</a>
    );
}
