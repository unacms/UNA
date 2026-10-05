import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Modal } from 'app/design/controls';
import { useBottomSheetData } from 'app/context/bottomsheet';
import Confirm from 'app/ui/molecules/dialogs/confirm';
import Msg from 'app/ui/molecules/dialogs/msg';
import FormModal from 'app/ui/molecules/dialogs/form-modal';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import Stripe from 'app/ui/molecules/integrations/stripe';
import { useGrid } from './context';

/**
 * Overlay dialogs for the grid: bottom sheet form, Stripe/credits checkout,
 * confirm, and calculated-time / error messages.
 *
 * Actions only put data into the store; JSX lives here.
 */
export default function GridModals() {
    const { t } = useTranslation();
    const { setBottomSheetData } = useBottomSheetData();
    const openedRef = useRef(false);

    const sheetBlock = useGrid((state) => state.sheetBlock);
    const formBlock = useGrid((state) => state.formBlock);
    const stripeCheckout = useGrid((state) => state.stripeCheckout);
    const pageData = useGrid((state) => state.pageData);
    const confirm = useGrid((state) => state.confirm);
    const message = useGrid((state) => state.message);

    const closeAll = useGrid((state) => state.closeAll);
    const closeStripe = useGrid((state) => state.closeStripe);
    const closeAndReload = useGrid((state) => state.closeAndReload);
    const handlePageModalData = useGrid((state) => state.handlePageModalData);
    const cancelConfirm = useGrid((state) => state.cancelConfirm);
    const acceptConfirm = useGrid((state) => state.acceptConfirm);
    const hideMessage = useGrid((state) => state.hideMessage);

    /**
     * The sheet mirrors `sheetBlock`. Closing is guarded by `openedRef` so that
     * mounting a grid never dismisses a sheet opened by another component.
     */
    useEffect(() => {
        if (sheetBlock) {
            openedRef.current = true;
            setBottomSheetData({
                title: sheetBlock.title,
                content: (
                    <View className="px-1">
                        <BlockByData
                            onFormEmpty={() => closeAndReload()}
                            block={sheetBlock.block}
                        />
                    </View>
                ),
            });
            return;
        }

        if (openedRef.current) {
            openedRef.current = false;
            setBottomSheetData(false);
        }
    }, [sheetBlock, setBottomSheetData, closeAndReload]);

    return (
        <>
            {formBlock ? (
                <Modal title={formBlock.content[0]?.title ? formBlock.content[0]?.title : " "} onVisible={!!formBlock} onClose={() => closeAll()}>
                    <View className='px-4'>
                        <BlockByData onFormEmpty={() => closeAndReload()} block={formBlock} />
                    </View>
                </Modal>
            ) : null}
            {stripeCheckout ? (
                <Modal scrollable title={t('Checkout')} onVisible={!!stripeCheckout} onClose={() => closeStripe()}>
                    <View className='px-4'>
                        <Stripe
                            payment_type={stripeCheckout.payment_type}
                            seller_id={stripeCheckout.seller_id}
                            items={stripeCheckout.items}
                        />
                    </View>
                </Modal>
            ) : null}
            <FormModal pageData={pageData} setPageData={handlePageModalData} url={pageData?.url} />
            <Confirm onVisible={confirm.show} title={t("Are you sure?")} handleCancel={cancelConfirm} handleOk={acceptConfirm} />
            <Msg
                onVisible={!!message}
                title={message}
                text={message}
                handleOk={hideMessage}
            />
        </>
    );
}
