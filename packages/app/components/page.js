import PageDataContext from 'app/context/page';
import Cell from 'app/components/cell';
import Home from 'app/components/pages/home';

export default function Page(props) {
    let data = props.data;
console.log('*********** page data:', data);
    const cells = Object.keys(data.elements).map(key => {
        return <Cell key={key} blocks={data.elements[key]} />
    });

    if (props.data.uri != 'home'){
        return (
            <PageDataContext>{cells}</PageDataContext>
        );
    }
    else{
        return (
            <PageDataContext><Home>{cells}</Home></PageDataContext>
        );
    }
}