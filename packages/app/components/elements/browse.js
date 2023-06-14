import React, { useState } from 'react';
import { FlatList, Button, Text, View } from 'react-native';
import { useInfiniteQuery } from  '@tanstack/react-query'
import { fetcher } from '../../lib/fetcher';

    

export default function ElementBrowse(props) {
    let data = props.data;

    const fetchPosts = async ({ pageParam = 1, queryKey }) => {
        console.log(444);
        const sRequest = prepareUrl() ;
        console.log(555, sRequest);
        return await fetcher(sRequest);
    };
    
    function prepareUrl () {
        let sUrl = undefined;
        console.log(data)
        switch(data.unit) {
            case 'notifications':
                sUrl = data.request_url + JSON.stringify({'params': browseParams});
                break;
                
            default:
                let params = Object.assign({}, browseParams)
                params.start = parseInt(browseParams.start) + parseInt(browseParams.per_page);
                sUrl = data.request_url + JSON.stringify({'params': params});
        }
    
        return sUrl;
    }

    const {
        data2,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery(['repoData'], fetchPosts, {
        getNextPageParam: (lastPage, pages) => pages.length + 1,
    });
    console.log(data2);
    const loadMoreButton = () => (
        <Button
            onPress={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            title={isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'Nothing more to load'}
        />
    );

   
    

    return (
        <View>
            <FlatList
                data={data.data}
                renderItem={({ item }) => (
                    <Text>{item.title}</Text>
                )}
                keyExtractor={(item) => item.id.toString()}
                ListFooterComponent={loadMoreButton}
            />
        </View>
    );
};

