import PageDataContext from 'app/context/page';
import Cell from 'app/components/cell';

export default function Page(props) {
    let data = props.data;

    const cells = Object.keys(data.elements).map(key => {
        return <Cell key={key} blocks={data.elements[key]} />
    });

    return (
        <PageDataContext>{cells}</PageDataContext>
    );
}