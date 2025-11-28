import Unit from 'app/components/unit'
import Galery from 'app/ui/molecules/gallery'

export default function Browse({ unitMode, data, limit_by, galery_view, galery_autoscroll}) {

    if (data.unit == 'mixed') {
        data.unit = 'general-profile-list'
    }

    const limitedData = limit_by ? data.data.slice(0, limit_by) : data.data

    const items = limitedData.map((item, index) => {
        return (<Unit
            key={`item${index}`}
            unit={data.unit ? data.unit : ''}
            mode={unitMode}
            module={data.module ? data.module : ''}
            object_id={data.object_id ? data.object_id : ''}
            view={data.view ? data.view : ''}
            data={item}
        />);
    })

    return galery_view ?  <Galery autoscroll={galery_autoscroll} items={items} /> : items;


}
