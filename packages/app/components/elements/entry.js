import Image from '../atoms/image';

export default function ElementEntry({data}) {
    return (
        <div className='@container/cell'>
        <div className="p-4 relative sm:my-0 sm:mx-4   @xl/cell:border-x border-gray-300/80  bg-white  dark:bg-gray-900  dark:border-gray-800/50">
            {(data.image) && <Image {...data.image} alt={data.title} priority className="w-full aspect-video @xl/cell:rounded-lg mb-4" />}  
            <h1 className="text-3xl @3xl/cell:text-4xl  font-bold text-gray-900 dark:text-gray-50 ">{data.title}</h1>
            <div className="u-vanilla-html " dangerouslySetInnerHTML={{__html:data.text}} />
        </div>
        </div>
    );
}
