import { View } from 'app/design/view';
import { UnitProfileImage, UnitTitle, UnitWrapper } from 'app/components/units/helpers';

export default function Unit({ data, unitType, module }) {

   

    const isSkeleton = data?.skeleton;

    return (
        <UnitWrapper data={data} module={module} as="list" padding="p-3 sm:p-2">
            <View className="flex-row sm:flex-col gap-3 sm:gap-1">
                <UnitProfileImage data={{...data, fullname: '?'}} skeleton={isSkeleton} />
                <View className="py-1 sm:p-1 justify-between gap-2 flex-auto ">
                    <View className="gap-2 h-12">
                        <UnitTitle
                            title={data.title}
                            skeleton={isSkeleton}
                            numberOfLines={1}
                        />
                       
                    </View>
                    
                </View>
            </View>
        </UnitWrapper>
    )
}
