import Unit from 'app/components/unit'
import Galery from 'app/ui/molecules/gallery'
import { View, Row, ScrollView } from 'app/design/view'
import { callFn } from 'app/lib/functions/call'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function Browse({ unitMode, data, limit_by, view, autoscroll, blockWrapperProps}) {

    // view can be row (explore page as example), galery (featured blocks in sidebar as example)
    if (data.unit == 'mixed') {
        data.unit = 'general-profile-list'
    }

    const layout = callFn('layoutForList', [data.module]);

    const limitedData = limit_by ? data.data.slice(0, limit_by) : data.data

    const items =  limitedData.map((item, index) => {
        return view == 'row' ? (<View key={`item${index}`} className={layout || 'w-full'}><Unit
            
            unit={data.unit ? data.unit : ''}
            mode={unitMode}
            module={data.module ? data.module : ''}
            object_id={data.object_id ? data.object_id : ''}
            view={data.view ? data.view : ''}
            data={item}
        /></View>) : <Unit
            key={`item${index}`}
            unit={data.unit ? data.unit : ''}
            mode={unitMode}
            module={data.module ? data.module : ''}
            object_id={data.object_id ? data.object_id : ''}
            view={data.view ? data.view : ''}
            data={item}
        />;
    })

    const content = view == 'galery' ? <Galery autoscroll={autoscroll} items={items} /> : (view == 'row' ? <Row className="@container/list overflow-hidden">{items}</Row> : items);
    return <BlockWrapper {...blockWrapperProps}>{content}</BlockWrapper>

}
