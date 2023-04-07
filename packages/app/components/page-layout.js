import PageLayoutDefault from './page-layout/default';
import PageLayout1 from './page-layout/layout_top_area_bar_right';
import PageLayout2 from './page-layout/layout_topbottom_area_bar_left';
import PageLayout3 from './page-layout/layout_topbottom_area_bar_right';


const componentsMap = {
    'default': PageLayoutDefault,
    'layout_top_area_bar_right': PageLayout1,
    'layout_topbottom_area_bar_left': PageLayout2,
    'layout_topbottom_area_bar_right': PageLayout3
};

export default function PageLayout(props) {
    console.log('aaaaaaaaa', props.data.layout);
    const Component = componentsMap[props.data.layout];
    if (!Component)
       return <PageLayoutDefault {...props} />;

    return <Component {...props} />;
}