export default function (props) {

    const setTosterVisible = (val) => {
        const current = tosterRef.current;
        if (current) {
            current.setVisible(val);
        }
    }
    
    let maxIdLocal = 0;
    const bUseDaemon =  (props.data.unit == 'feed');
    const { daemonData, error } = useDaemon('/api.php?r=bx_timeline/get_live_update&params[]='+JSON.stringify({'params': getCurrentParams(true)})+'&params[]=0&params[]=0', false, bUseDaemon);
    if (bUseDaemon){
        maxIdLocal = dataItems?.data.length > 0 ? dataItems?.data.reduce((max, item) => item.id > max ? item.id : max, dataItems?.data[0].id) : 0;
        if (daemonData && daemonData?.count && maxId > 0 && maxId < daemonData.count){
            setTimeout(() => {
                setTosterVisible(true);
            }, 100);
           
        }
    }

    useEffect(() => {
        if (maxIdLocal >0 && maxIdLocal != maxId){
           setMaxId(maxIdLocal)
        }
      }, [maxIdLocal]);
   

    const showNewContent = async () => {
        setTosterVisible(false); 
        let sResponse =  await fetcher(prepareUrl(true));
        maxIdLocal = sResponse.data[0].data.data.length > 0 ? sResponse.data[0].data.data.reduce((max, item) => item.id > max ? item.id : max, sResponse.data[0].data.data[0].id) : 0;
        setLayoutData(sResponse.data[0].data.data);
        setMaxId(maxIdLocal);
        uniRef.current.scrollToIndex({ animated: true, index: -1 });
   
    }
    
}