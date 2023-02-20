import Link from 'next/link';

export default function ElementLink(props) {
    return (
        <Link {...props} >{props.children}</Link>
    );
}
