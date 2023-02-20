//import { motion } from "framer-motion";
//import {useRouter} from "next/router";
import { View } from 'app/design/view'

export default function Main(props) {  
    
    var initial = { y: 10, opacity: 0 };
    var animate = { y: 0, opacity: 1 };
    var exit = { y: -10, opacity: 0 };
    var transition = { duration: 0.2 };

    var ref ='';
    if (typeof window !== 'undefined' && sessionStorage.getItem("gl_UrlRef"))
        ref = sessionStorage.getItem("gl_UrlRef");
/*
    const router = useRouter()
    const path = router.asPath;
*/
    // left slide translation
    /*if (
        (path.includes('posts-home') && ref.includes('view-post'))
        || (path== '/' && (ref.includes('groups-home') || ref.includes('posts-home') || ref.includes('persons-home')) )
        || (path.includes('groups-home') && (ref.includes('posts-home') || ref.includes('persons-home')))
        || (path.includes('posts-home') && ref.includes('persons-home'))
        ){
        initial = { x: -300, opacity: 0 };
        animate = { x: 0, opacity: 1 };
        exit = { x: -300, opacity: 0 };
        transition = {
            type: "spring",
            stiffness: 250,
            damping: 50,
          };
    }*/

    // right slide translation
    /*if ((path.includes('view-post') && ref.includes('posts-home'))
        || (path.includes('groups-home') && ref == '/')
        || (path.includes('posts-home') && (ref.includes('groups-home') || ref == '/'))
        || (path.includes('persons-home') && (ref.includes('posts-home') || ref.includes('groups-home') || ref == '/'))
        ){
        initial = { x: 300, opacity: 0 };
        animate = { x: 0, opacity: 1 };
        exit = { x: 0, opacity: 0 };
        transition = {
            type: "spring",
            stiffness: 250,
            damping: 50 ,
          };
    }*/

    return <View {...props}></View>
/*
    return (
        <motion.div
            initial={initial}
            animate={animate}
            exit={exit}
            transition={transition}
            >
            <main className=""> {props.children} </main>
        </motion.div>
    );
*/
}
