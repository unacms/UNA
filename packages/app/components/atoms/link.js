// import Link from 'next/link';
// import {useRouter} from "next/router";
import { Link } from 'solito/link'

export default function ElementLink(props) {

    return (
        <Link {...props}>{props.children}</Link>
    );

/*
    const router = useRouter()
    const path = router.asPath;

    return (
        <Link {...props}  onClick={() => {sessionStorage.setItem("gl_UrlTrg", props.href);sessionStorage.setItem("gl_UrlRef", path);}} >{props.children}</Link>
    );
*/
}
