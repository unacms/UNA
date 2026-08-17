import {
    UnitInvitationActions,
    UnitProfileRow,
    useInvitationAction,
} from 'app/lib/unit-helpers'

export default function Unit({ data }) {
    const { dismissed, processInvitation } = useInvitationAction()
    if (dismissed) return null

    return (
        <UnitProfileRow
            data={data}
            meta={
                <UnitInvitationActions
                    data={data}
                    processInvitation={processInvitation}
                />
            }
        />
    )
}
