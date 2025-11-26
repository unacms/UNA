import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useRef, useCallback, useMemo } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { FeedbackHaptics, visibilityById } from 'app/lib/util'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { Platform } from 'react-native'
import { Text } from 'app/design/typography'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/ui/molecules/card'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { stripTags } from 'app/lib/util'
import { Keyboard } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { getEditorHeight } from 'app/lib/form-helpers';
import { PollButton, LabelButton, FileButton } from 'app/lib/form-helpers'
import { useBreakpoint, useWindowHeight } from 'app/context/measure';
import emitter from 'app/context/emitter';
import { fetcher } from 'app/lib/fetcher';
import { getVisibilityValues } from 'app/components/form-fields/select';

function ProfileView({ isImageOnly = false, data, handleSubmit, showImage, setShowImage, author }) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const formContext = useFormContext();
    
    // Profile selection state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [availableProfiles, setAvailableProfiles] = useState(null);
    const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);

    // Privacy selector state
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showPrivacySubModal, setShowPrivacySubModal] = useState(false); // For sub-selection (specific friends, etc.)
    const [subValues, setSubValues] = useState([]); // Selected sub-items

    // Watch the privacy field value
    const privacyFieldName = 'object_privacy_view';
    const currentPrivacyValue = formContext?.watch(privacyFieldName);

    // Get privacy input data
    const privacyInput = data?.inputs?.['object_privacy_view'];
    
    // Initialize subValues from form field on mount
    useEffect(() => {
        const existingSubValue = privacyInput?.subvalue;
        if (existingSubValue) {
            setSubValues(existingSubValue.split(",").map(value => parseInt(value, 10)));
        }
    }, [privacyInput?.subvalue]);

    // Fetch available profiles when modal opens
    useEffect(() => {
        if (showProfileModal && !availableProfiles) {
            fetchProfiles();
        }
    }, [showProfileModal]);

    const fetchProfiles = async () => {
        try {
            const response = await fetcher('/api.php?r=system/account_profile_switcher/TemplServiceProfiles');
            if (response?.data?.[0]?.data?.profiles) {
                setAvailableProfiles(response.data[0].data.profiles);
            }
        } catch (error) {
            console.error('Failed to fetch profiles:', error);
        }
    };

    const handleProfileSelect = async (profile) => {
        // If selecting the same profile, just close the modal
        if (profile.id === currentUser.id) {
            setShowProfileModal(false);
            return;
        }

        setIsSwitchingProfile(true);
        try {
            // Add hash to URL to re-open post form after reload
            if (typeof window !== 'undefined') {
                window.location.hash = 'create-post';
            }
            
            // Call API to switch profile globally
            const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + profile.id);
            if (result?.data) {
                // Update global user context (this switches the profile app-wide)
                setCurrentUser(result.data);
            }
        } catch (error) {
            console.error('Failed to switch profile:', error);
            // Clear the hash if switch failed
            if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        } finally {
            setIsSwitchingProfile(false);
            setShowProfileModal(false);
        }
    };

    // Options that require sub-selection (specific friends, relationships, memberships)
    const SUB_SELECTION_OPTIONS = [6, 8, 9];

    const handlePrivacySelect = (value) => {
        const numValue = parseInt(value, 10);
        formContext.setValue(privacyFieldName, value);
        
        // Clear sub-values when changing to a different option
        if (numValue !== parseInt(currentPrivacyValue, 10)) {
            setSubValues([]);
        }
        
        // Check if this option needs sub-selection
        if (SUB_SELECTION_OPTIONS.includes(numValue)) {
            setShowPrivacySubModal(numValue);
        } else {
            setShowPrivacyModal(false);
        }
    };

    const handleSubValueToggle = (value) => {
        // Keep values as-is (could be string or number depending on data source)
        setSubValues(prev => {
            // Check if value exists (handle both string and number comparison)
            const valueExists = prev.some(v => String(v) === String(value));
            if (valueExists) {
                return prev.filter(v => String(v) !== String(value));
            } else {
                return [...prev, value];
            }
        });
    };

    const applySubSelection = () => {
        // Save sub-values to form field
        formContext.setValue(privacyFieldName + '_items', subValues);
        setShowPrivacySubModal(false);
        setShowPrivacyModal(false);
    };

    if (!currentUser) return null;

    // Use author (for editing) or current user (the globally selected profile)
    const displayProfile = author ? author : {
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    };

    const profileData = {
        ...displayProfile,
        url_avatar: displayProfile.url_avatar || displayProfile.avatar,
        url: null,
    };

    if (isImageOnly) {
        return <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />;
    }

    const isHiddenVisibility = data?.inputs?.['object_privacy_view']?.origtype == 'hidden' || !data?.inputs?.['object_privacy_view']
    const hasMultipleProfiles = currentUser?.profiles_count > 1;

    const authorName = (
        <Text className="text-foreground leading-6 font-semibold tracking-tight text-sm truncate">
            {displayProfile.display_name}
        </Text>
    );

    // Get privacy options from the form field data
    // Prepare sub-options for each type
    const prepareValuesFriends = (values) => {
        if (!values || !Array.isArray(values)) return [];
        return values.map(item => ({
            key: item.key,
            value: item.value?.display_name || item.value,
            icon: item.value?.display_name ? (
                <Profile
                    {...item.value}
                    displayType="unit_wo_info"
                    displaySize="sm"
                />
            ) : null
        }));
    };

    const prepareSubOptions = (values) => {
        if (!values) return [];
        return getVisibilityValues(values);
    };

    const subOptionsMap = {
        6: privacyInput?.values_friends ? prepareSubOptions(prepareValuesFriends(privacyInput.values_friends)) : [],
        8: privacyInput?.values_relations ? prepareSubOptions(privacyInput.values_relations) : [],
        9: privacyInput?.values_memberships ? prepareSubOptions(privacyInput.values_memberships) : [],
    };
    
    // Filter out options that require sub-selection but don't have data (matching original visibility.js behavior)
    const allPrivacyOptions = privacyInput?.values ? getVisibilityValues(privacyInput.values).filter(item => item.value !== '') : [];
    const privacyOptions = allPrivacyOptions.filter(item => {
        const numValue = parseInt(item.value, 10);
        // Only show sub-selection options if the corresponding data exists
        if (numValue === 6 && !privacyInput?.values_friends) return false;
        if (numValue === 8 && !privacyInput?.values_relations) return false;
        if (numValue === 9 && !privacyInput?.values_memberships) return false;
        return true;
    });
    
    const currentSubOptions = subOptionsMap[showPrivacySubModal] || [];
    
    // Get labels for selected sub-values for display
    const getSelectedSubLabels = () => {
        const options = subOptionsMap[parseInt(currentPrivacyValue, 10)] || [];
        return options.filter(item => subValues.some(v => String(v) === String(item.value))).map(item => item.label);
    };
    const selectedSubLabels = getSelectedSubLabels();
    
    // Get current privacy display info
    const currentPrivacyInfo = visibilityById(currentPrivacyValue, t);
    const currentPrivacyOption = privacyOptions.find(opt => opt.value == currentPrivacyValue);
    
    // Build display text with sub-selection info
    let privacyDisplayText = currentPrivacyInfo?.text || currentPrivacyOption?.label || t('Choose audience');
    if (selectedSubLabels.length > 0 && SUB_SELECTION_OPTIONS.includes(parseInt(currentPrivacyValue, 10))) {
        privacyDisplayText = selectedSubLabels.length > 2 
            ? `${selectedSubLabels.slice(0, 2).join(', ')} +${selectedSubLabels.length - 2}`
            : selectedSubLabels.join(', ');
    }
    const privacyIcon = currentPrivacyInfo?.icon || 'Globe';

    // Profile selection modal
    const profileModal = (
        <Modal
            title={isSwitchingProfile ? t("Switching...") : t("Post as")}
            onVisible={showProfileModal}
            onClose={!isSwitchingProfile ? () => setShowProfileModal(false) : undefined}
            transparent
            headerBorder
            scrollable
        >
            <ScrollView className="max-h-80">
                <View className={`flex-col gap-y-1 ${isSwitchingProfile ? 'opacity-50' : ''}`}>
                    {/* Current user profile - always shown first with checkmark */}
                    <Pressable
                        onPress={() => setShowProfileModal(false)}
                        disabled={isSwitchingProfile}
                        className="flex-row items-center px-2 py-1.5 rounded-xl gap-2 hover:bg-muted/60"
                    >
                        <Profile
                            {...currentUser}
                            url_avatar={currentUser.avatar}
                            displayType="unit_wo_info"
                            displaySize="base"
                        />
                        <Text className="flex-auto text-base font-semibold text-foreground truncate">
                            {currentUser.display_name}
                        </Text>
                        <Icon icon="Check" size={20} className="text-primary" />
                    </Pressable>

                    {/* Other available profiles */}
                    {availableProfiles?.filter(p => p.id !== currentUser.id).map((profile) => (
                        <Pressable
                            key={profile.id}
                            onPress={() => handleProfileSelect({
                                ...profile,
                                url_avatar: profile.avatar,
                            })}
                            disabled={isSwitchingProfile}
                            className="flex-row items-center px-2 py-1.5 rounded-xl gap-2 hover:bg-muted/60"
                        >
                            <Profile
                                {...profile}
                                url_avatar={profile.avatar}
                                displayType="unit_wo_info"
                                displaySize="base"
                            />
                            <Text className="flex-auto text-base font-semibold text-foreground truncate">
                                {profile.display_name}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </Modal>
    );

    // Get title for sub-selection modal
    const getSubModalTitle = () => {
        const info = visibilityById(showPrivacySubModal, t);
        return info?.text || t('Select');
    };

    // Sub-selection modal header with back button
    const subModalHeader = (
        <Row className="w-full items-center">
            <View className='flex-auto absolute left-0 right-0'>
                <Text className='text-foreground text-xl font-bold tracking-tight text-center'>
                    {getSubModalTitle()}
                </Text>
            </View>
            <View>
                <Button 
                    variant='secondary' 
                    size='sm' 
                    rounded 
                    startDecorator='ArrowLeft' 
                    onPress={() => setShowPrivacySubModal(false)} 
                />
            </View>
        </Row>
    );

    // Privacy selection modal
    const privacyModal = (
        <Modal
            title={showPrivacySubModal ? subModalHeader : t("Choose audience")}
            onVisible={showPrivacyModal}
            onClose={!showPrivacySubModal ? () => setShowPrivacyModal(false) : undefined}
            transparent
            headerBorder
            scrollable
        >
            {showPrivacySubModal ? (
                // Sub-selection content (specific friends, relationships, memberships)
                <>
                    <ScrollView className="max-h-80">
                        <View className="flex-col gap-y-1">
                            {currentSubOptions.length > 0 ? (
                                currentSubOptions.map((option) => {
                                    const isSelected = subValues.some(v => String(v) === String(option.value));
                                    return (
                                        <Pressable
                                            key={option.value}
                                            onPress={() => handleSubValueToggle(option.value)}
                                            className="flex-row items-center px-2 py-2.5 rounded-xl gap-3 hover:bg-muted/60"
                                        >
                                            {option.icon ? (
                                                <View className="w-8 h-8 items-center justify-center">
                                                    {option.icon}
                                                </View>
                                            ) : (
                                                <View className="w-8 h-8 items-center justify-center rounded-full bg-muted/60">
                                                    <Icon icon="User" size={18} className="text-foreground" />
                                                </View>
                                            )}
                                            <Text className="flex-auto text-base font-medium text-foreground">
                                                {option.label}
                                            </Text>
                                            <View className={`w-5 h-5 rounded border-2 items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                {isSelected && <Icon icon="Check" size={14} className="text-primary-foreground" />}
                                            </View>
                                        </Pressable>
                                    );
                                })
                            ) : (
                                <View className="p-4 items-center">
                                    <Text className="text-muted-foreground text-center">
                                        {t("No options available")}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                    <View className='flex-row justify-end pt-3 mt-3 border-t border-border'>
                        <Button 
                            title={t("Done")} 
                            size="base" 
                            variant="primary" 
                            onPress={applySubSelection} 
                        />
                    </View>
                </>
            ) : (
                // Main privacy options
                <ScrollView className="max-h-80">
                    <View className="flex-col gap-y-1">
                        {privacyOptions.map((option) => {
                            const optionInfo = visibilityById(option.value, t);
                            const optionIcon = optionInfo?.icon || 'Globe';
                            const optionLabel = optionInfo?.text || option.label;
                            const isSelected = option.value == currentPrivacyValue;
                            const hasSubOptions = SUB_SELECTION_OPTIONS.includes(parseInt(option.value, 10));

                            return (
                                <Pressable
                                    key={option.value}
                                    onPress={() => handlePrivacySelect(option.value)}
                                    className="flex-row items-center px-2 py-2.5 rounded-xl gap-3 hover:bg-muted/60"
                                >
                                    <View className="w-8 h-8 items-center justify-center rounded-full bg-muted/60">
                                        <Icon icon={optionIcon} size={18} className="text-foreground" />
                                    </View>
                                    <View className="flex-auto">
                                        <Text className="text-base font-medium text-foreground">
                                            {optionLabel}
                                        </Text>
                                        {/* Show selected sub-items info */}
                                        {isSelected && selectedSubLabels.length > 0 && hasSubOptions && (
                                            <Text className="text-sm text-muted-foreground">
                                                {selectedSubLabels.length > 3 
                                                    ? `${selectedSubLabels.slice(0, 3).join(', ')} +${selectedSubLabels.length - 3} more`
                                                    : selectedSubLabels.join(', ')}
                                            </Text>
                                        )}
                                    </View>
                                    {hasSubOptions && (
                                        <Icon icon="ChevronRight" size={18} className="text-muted-foreground" />
                                    )}
                                    {isSelected && !hasSubOptions && (
                                        <Icon icon="Check" size={20} className="text-primary" />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
        </Modal>
    );

    return (
        <View className="flex-row flex-auto items-center justify-between gap-x-2 text-neutral-400 dark:text-neutral-600">
            <View className="gap-1 flex-row flex-auto items-center">
                {/* Profile Switcher - clickable to open profile selection modal */}
                <Pressable 
                    onPress={() => hasMultipleProfiles && setShowProfileModal(true)}
                    className="flex-row items-center gap-x-2 group px-2 py-1.5 bg-muted/60 rounded-xl"
                    disabled={!hasMultipleProfiles}
                >
                    <Profile {...profileData} displaySize="xs" displayType="unit_wo_info" />
                    <View className="flex-row items-center gap-x-1">
                        {authorName}
                        {hasMultipleProfiles && (
                            <Icon 
                                icon="ChevronsUpDown" 
                                size={16} 
                                className="text-muted-foreground opacity-60 group-hover:opacity-100 web:transition-opacity" 
                            />
                        )}
                    </View>
                </Pressable>

                {/* Separator icon */}
                {!isHiddenVisibility && (
                    <Icon 
                        icon="ChevronRight" 
                        size={16} 
                        className="text-muted-foreground opacity-60" 
                    />
                )}

                {/* Privacy selector - custom styled to match profile switcher */}
                {!isHiddenVisibility && data?.inputs?.['object_privacy_view'] && (
                    <Pressable 
                        onPress={() => setShowPrivacyModal(true)}
                        className="flex-row items-center gap-x-2 group px-2 py-1.5 bg-muted/60 rounded-xl"
                    >
                        <Icon icon={privacyIcon} size={18} className="text-foreground w-7 h-7 items-center justify-center bg-muted rounded-full" />
                        <Text className="text-foreground font-semibold text-sm">
                            {privacyDisplayText}
                        </Text>
                        <Icon 
                            icon="ChevronsUpDown" 
                            size={16} 
                            className="text-muted-foreground opacity-60 group-hover:opacity-100 web:transition-opacity" 
                        />
                    </Pressable>
                )}
            </View>

            {/* Profile selection modal */}
            {profileModal}
            
            {/* Privacy selection modal */}
            {privacyModal}
        </View>
    );
}

export default function FormFeed(props) {
    const formContext = useFormContext()
    const { t } = useTranslation()
    const isFormOnly = props.exProps?.formOnly === true || props.name === 'feed_edit';

    const [showImage, setShowImage] = useState(isFormOnly ? true : false);
    const [modalKey, setModalKey] = useState(0);
    const [responseId, setResponseId] = useState(0)

    // Check if we should re-open the form after a profile switch
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkAndOpenForm = () => {
            console.log('[FormFeed] Checking hash:', window.location.hash, 'current showImage:', showImage);
            if (window.location.hash === '#create-post') {
                console.log('[FormFeed] Opening form from hash - setting showImage to true');
                // Clear the hash
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                // Open the form with a slight delay to ensure state is ready
                requestAnimationFrame(() => {
                    console.log('[FormFeed] Actually setting showImage now');
                    setShowImage(true);
                    setModalKey(k => k + 1);
                });
            }
        };

        // Check immediately
        checkAndOpenForm();
        
        // Also check after delays (in case of timing issues with hydration)
        const timer1 = setTimeout(checkAndOpenForm, 100);
        const timer2 = setTimeout(checkAndOpenForm, 500);
        const timer3 = setTimeout(checkAndOpenForm, 1000);
        const timer4 = setTimeout(checkAndOpenForm, 2000);
        
        // Listen for hash changes
        window.addEventListener('hashchange', checkAndOpenForm);
        
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            window.removeEventListener('hashchange', checkAndOpenForm);
        };
    }, [showImage]);

    const isWeb = Platform.OS === 'web'
    const isIos = Platform.OS === 'ios'
    const currentBreakpoint = useBreakpoint();
    const isSmall = currentBreakpoint == 0 || !isWeb ? true : false
    const scrollViewRef = useRef(null)

    // Auto-growth state and logic
    const screenHeight = useWindowHeight();
    const baseEditorHeight = 120; // Initial height for the post input
    const editorMaxHeight = screenHeight / 2; // Max height it can grow to
    const [editorHeight, setEditorHeight] = useState(baseEditorHeight);
    const rawEditorText = formContext.watch('text');
    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    const updateEditorHeight = (newHeight) => {
        if (Math.round(editorHeight) !== Math.round(newHeight)) {
            setEditorHeight(newHeight);
        }
    };

    function checkEditorHeight(reportedInternalHeight) {
        const actualHasText = stripTags(formContext.getValues('text') || '').trim().length > 0;

        // For post editor: 1 line text ~24px. Wrapper padding (px-3) ~24px. Editor internal est. ~2px. Total ~50px.
        const minVisualHeightWhenTyping = 50;
        const visualFloorHeight = actualHasText ? minVisualHeightWhenTyping : baseEditorHeight;

        let totalChromeHeightEstimate;
        if (actualHasText) {
            // Wrapper padding: 12px (top) + 12px (bottom) = 24px. Editor internal (estimate): 2px
            totalChromeHeightEstimate = 24 + 2; // 26px
        } else {
            // For baseHeight, chrome is the same as above if baseHeight is for active input.
            // If baseHeight is for an empty, non-focused input, it might be less, but we use consistent for simplicity.
            totalChromeHeightEstimate = 24 + 2; // 26px 
        }

        const growthStepAmount = 24; // Matches .tiptap-default line-height

        const newCalculatedHeight = getEditorHeight(
            reportedInternalHeight,
            visualFloorHeight,
            totalChromeHeightEstimate,
            growthStepAmount,
            editorMaxHeight
        );
        const finalHeight = Math.max(newCalculatedHeight, baseEditorHeight);
        updateEditorHeight(finalHeight);
    }

    useEffect(() => {
        const strippedText = stripTags(rawEditorText || '').trim();
        const actualHasText = strippedText.length > 0;
        const minVisualHeightWhenTyping = 50; // Synchronized with checkEditorHeight logic

        if (actualHasText) {
            updateEditorHeight(Math.max(editorHeight, minVisualHeightWhenTyping));
        } else {
            updateEditorHeight(baseEditorHeight);
        }
    }, [rawEditorText, baseEditorHeight]);

    function onClose() {
        setShowImage(false)
        if (props.exProps?.onClose) {
            props.exProps.onClose()
        }
    }

    useEffect(() => {
        if (props.response?.id && props.response?.id != responseId) {
            emitter.emit('feed', { action: 'new_content', data: props.response });
            onClose();
            setResponseId(props.response?.id)
        }
    }, [props.response?.id])

    useEffect(() => {
        if (showImage) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [showImage])

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
            }
        )
        return () => {
            keyboardDidShowListener.remove()
        }
    }, [])

    let text = formContext.watch('text');
    let object_privacy_view = formContext.watch('object_privacy_view');
    if (!text) text = ''
    if (typeof text === 'string') {
        text = stripTags(text).trim()
    }

    const header = (
        <Row className="w-full items-start">

            <View className="flex-auto">
                <ProfileView
                    author={props.exProps?.item?.author_data}
                    data={props.data}
                    handleSubmit={props.handleSubmit}
                    showImage={showImage}
                    setShowImage={setShowImage}
                />
            </View>

            <Button
                onPress={onClose}
                variant="secondary"
                rounded
                size="sm"
                startDecorator="X"
            />
        </Row>
    )

    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
        setShowImage(false)
    }, []);


    const isPollsPresent = !!props.data.inputs['polls'];
    const isLabelsPresent = !!props.data.inputs['labels'];


    const form = <KbAvoidingView className="flex-1">
        {getFormFieldByData(props.data.inputs['action'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['object_cf'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['owner_id'], props.handleSubmit, 'default')}
        {getFormFieldByData(props.data.inputs['type'], props.handleSubmit, 'default')}
        <View className="justify-between flex-col flex-auto ">
            <View className="w-full flex-1 justify-start p-2 ">
                <View 
                    className="flex-auto"
                    style={{ 
                        height: editorHeight,
                        ...(isWeb && { transition: 'height 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' })
                    }}
                >
                    {getFormFieldByData(
                        props.data.inputs['text'],
                        props.handleSubmit,
                        'custom',
                        {
                            form_name: props.name,
                            styles: { verticalAlign: 'top' },
                            focus: true,
                            noPadding: true,
                            bg: 'transparent',
                            placeholder: 'Write here...',
                            linkify: true,
                            autofocus: Date.now(),
                            classes: 'flex-1 tiptap-default',
                            onHeight: checkEditorHeight,
                        }
                    )}
                </View>
                <View >
                    <Row className='flex-wrap w-full'>
                        {
                            getFormFieldByData(
                                props.data.inputs['video'],
                                props.handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                        {
                            getFormFieldByData(
                                props.data.inputs['photo'],
                                props.handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                        {
                            getFormFieldByData(
                                props.data.inputs['file'],
                                props.handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                    </Row>

                    {isLabelsPresent && (
                        <View className="flex-auto">
                            {
                                getFormFieldByData(
                                    props.data.inputs['labels'],
                                    props.handleSubmit,
                                    'notitle',
                                    { hide_button: true, noPadding: true }
                                )
                            }
                        </View>
                    )}
                    {isPollsPresent && (
                        <View className="">
                            {getFormFieldByData(
                                props.data.inputs['polls'],
                                props.handleSubmit,
                                'custom',
                                { hide_button: true }
                            )}
                        </View>
                    )}

                </View>
            </View>

            <View className="  ">

                <View className=" items-center flex-auto w-full gap-2">

                    <Row className="gap-x-2 w-full justify-between ">
                        <Row className="flex-none gap-x-2">
                            {props.data.inputs['obfuscate_faces'] && (
                                <View className="">
                                    {getFormFieldByData(
                                        props.data.inputs['obfuscate_faces'],
                                        props.handleSubmit,
                                        'default'


                                    )}
                                </View>
                            )}
                            {props.data.inputs['photo'] && (
                                <View className="">
                                    <FileButton field_name='photo' icon="Image" tooltip='Add Photos' />
                                </View>
                            )}
                            {props.data.inputs['video'] && (
                                <View className="">
                                    <FileButton field_name='video' icon="Image" tooltip='Add Photos or Videos'  />
                                </View>
                            )}
                            {(props.data.inputs['video'] && !isWeb) && (
                                <View className="">
                                    <FileButton field_name='video' icon="Image" />
                                </View>
                            )}
                            {props.data.inputs['file'] && (
                                <View>
                                    <FileButton field_name='file' icon="Paperclip"  />
                                </View>
                            )}
                            {isLabelsPresent && (
                                <View>
                                    <LabelButton field_name='labels' />
                                </View>
                            )}
                            {isPollsPresent && (
                                <View className="">
                                    <PollButton field_name='polls' />
                                </View>
                            )}
                        </Row>
                        <View className=" flex-1 web:flex-none items-end ">
                            <View>
                                {getFormFieldByData(
                                    props.data.inputs['tlb_do_submit'],
                                    props.handleSubmit,
                                    'default',
                                    {
                                        disabled: text != '' && object_privacy_view != '' ? false : true,
                                        noPadding: true,
                                        size: 'base',
                                        notFullWidth: true,
                                        icon: "SendHorizontal",

                                    }
                                )}
                            </View>
                        </View>
                    </Row>
                </View>
            </View>
        </View>
    </KbAvoidingView>

    if (isFormOnly) {
        return (
            <View className="w-full flex-1 h-full">
                <View className="items-start justify-start ">
                    {header}
                </View>
                {form}
            </View>
        )
    }

    console.log('[FormFeed] Rendering, showImage:', showImage, 'modalKey:', modalKey);

    return (
        <View className="w-full">
            {showImage && (
                <Modal
                    key={modalKey}
                    title={isSmall ? header : (
                        <ProfileView
                            data={props.data}
                            handleSubmit={props.handleSubmit}
                            showImage={showImage}
                            setShowImage={setShowImage}
                        />
                    )}
                    onVisible={showImage}
                    
                    {...(!isSmall && { onClose: handleModalClose })}
                    padding=" p-0 "
                    transparent={true}
                    autoHeight={true}
                    onRequestClose={handleModalClose}
                >
                    {form}
                </Modal>
            )}
            {props.exProps?.mode == 'button' ? (
                <Button
                    variant="primary"
                    title="Post"
                    tooltip="Post"
                    size="base"
                    rounded
                    fullWidth
                    onPress={() => {
                        FeedbackHaptics('Medium')
                        setShowImage(true)
                        setModalKey(k => k + 1)
                    }}
                />
            ) : (
                <Card
                    rounded=" rounded-none sm:rounded-2xl   "
                    margin=" mx-auto mb-1 sm:mb-3 border-y border-x-none sm:border-x "
                    addClassName=" w-full px-3 pt-2 pb-3 sm:p-4  "
                    border="border-y border-x-none sm:border "
                >
                    {
                        props?.exProps?.showForm !== false && (
                            <Row className="gap-2 lg:gap-3">
                                <View className="my-auto">
                                    <ProfileView isImageOnly={true} />
                                </View>
                                <View className="flex-auto">
                                    <Button
                                        size="base"
                                        variant="secondary"
                                        fullWidth
                                        rounded
                                        title={t('Create new post') + '...'}
                                        align="start"
                                        onPress={() => {
                                            FeedbackHaptics('Medium')
                                            setShowImage(true)
                                            setModalKey(k => k + 1)
                                        }}
                                    />
                                </View>
                            </Row>)
                    }
                </Card>
            )}
        </View>
    )
}
