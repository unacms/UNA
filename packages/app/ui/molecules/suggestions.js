import { View, ScrollView, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';

import Browse from 'app/components/elements/browse'


export default function Suggestions(props) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    console.log('currentUser', currentUser);
    const [showModal1, setShowModal1] = useState(true);
    const [showModal2, setShowModal2] = useState(false);
    
    const hideModal1 = () => { 
        setShowModal1(false);
        setShowModal2(true)
    };

    if (!currentUser)
        return <></>
    
    let data = {request_url : '/api.php?r=system/browse_recommendations_friends/TemplServiceProfiles&params[]=' + currentUser.id + '&params[]=', "type" : "obj_own_and_con", unit:"general-content-list"}
    let data2 = {request_url : '/api.php?r=bx_groups/browse_recommendations_fans&params[]=' + currentUser.id, "type" : "obj_own_and_con", unit:"general-content-list"}

    return (
        <View>
            <Modal title="Recommended friends" onVisible={showModal1} outerClickClose={false} onClose={() => hideModal1()}>
                <Browse height={400}  data={data} perLine={3} unitType="person_friends_recommendations"/>
            </Modal>

            <Modal title="Recommended groups" onVisible={showModal2} outerClickClose={false} onClose={() => setShowModal2(false)}>
                <Browse height={400}  data={data2} perLine={3} unitType="person_friends_recommendations"/>
            </Modal>
        </View>
    )
}