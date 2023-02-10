import React, { useState } from 'react';


export default function ElemenToggle(props) {

    const [isShow, setIsShow] = useState(true);
    const showPopup = () => {
        props.stateAction(props.stateValue == props.name ? false : props.name);
    };

    return (
        <>
        { React.cloneElement( props.children[0], { onClick: showPopup } ) } 
        { React.cloneElement( props.children[1], { className: (props.stateValue == props.name ? '' : 'hidden ') + props.children[1].props.className } ) }
        </>
    );
}
