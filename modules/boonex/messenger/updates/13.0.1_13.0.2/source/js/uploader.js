/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */

/**
 * FilePond files uploader integration
 */

;window.oMessengerUploader = class BxMessengerFilesUploader {
    constructor(oOptions) {
        this.bClean = false;
        this.oUploader = null;
        this.oOptions = oOptions;
        this.isReady = false;
        this.isBlockVersion = +this.setOption('is_block_version');
        this.sMainObject = this.setOption('main_object_name');
        this.oTarget = null;

        this.sFileUrl = this.setOption('uploader_url');
        this.sTmpFileUrl = this.setOption('remove_temp_file_url');
        this.aRestrictedExtensions = this.setOption('restricted_extensions', []);
        this.maxFiles = this.setOption('number_of_files');
        this.onAddFilesCallback = this.setOption('onAddFilesCallback', null);
        this.onUpdateAttachments = this.setOption('onUpdateAttachments', null);
        this.onUploadingComplete = this.setOption('onUploadingComplete', null);
        this.maxFileSize = this.setOption('file_size') + 'MB';

        /* FilePond plugins begin*/
        FilePond.registerPlugin(
            FilePondPluginImagePreview,
            FilePondPluginMediaPreview,
            FilePondPluginFileValidateSize,
            FilePondPluginFileRename
        );

        $(document).on('drop paste', (e) => {
            const { target } = e;
            this.oTarget = target;
        });
    }

    setOption(sName, mixedDefault = ''){
        return this.oOptions[sName] ? this.oOptions[sName] : mixedDefault;
    }

    init() {
        const _this = this;

        return this.oUploader = (function(sName){
            const oUploader = FilePond.create($(`[name="${sName}"]`).get(0),
                {
                    server: {
                        url: `${_this.sFileUrl}`,
                        revert: null,
                    },
                    name: sName,
                    allowFileRename: true,
                    imagePreviewMaxHeight: 96,
                    dropValidation: true,
                    dropOnPage: true,
                    allowMultiple: true,
                    allowBrowse: true,
                    dropOnElement: false,
                    allowPaste: true,
                    checkValidity: true,
                    allowFileSizeValidation: true,
                    maxFiles: _this.maxFiles,
                    acceptedFileTypes: [],
                    labelInvalidField: _t('_bx_messenger_upload_invalid_file_type'),
                    labelMaxFileSizeExceeded: _t('_bx_messenger_file_is_too_large_error'),
                    labelMaxFileSize: _t('_bx_messenger_file_is_too_large_error_details'),
                    labelFileProcessing: _t('_bx_messenger_uploading_file'),
                    labelFileProcessingComplete: _t('_bx_messenger_upload_is_complete'),
                    labelFileProcessingAborted: _t('_bx_messenger_upload_cancelled'),
                    labelFileProcessingError: _t('_bx_messenger_invalid_server_response'),
                    labelButtonRemoveItem: _t('_bx_messenger_uploading_remove_button'),
                    maxFileSize: _this.maxFileSize,
                    fileRenameFunction: file => {
                        const {extension} = file;
                        const sChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        let sNewName = '';
                        for (let i = 0; i < 12; i++)
                            sNewName += sChars.charAt(Math.floor(Math.random() * sChars.length));

                        return (sNewName && (sNewName.toLowerCase() + extension)) || '';
                    },
                    beforeDropFile: function (oFile) {
                        const sPreg = /\.(jpeg|jpg|gif|png)$/;
                        if (sName !== _this.instance.name)
                            return false;

                        if (typeof oFile === 'string')
                            return sPreg.test(oFile);

                        return oFile instanceof File && !~oFile.type.toLowerCase().indexOf('text/html');
                    },
                    beforeAddFile: function ({file}) {
                        const { type } = file;
                        if (sName !== _this.instance.name)
                            return false;

                        if (type) {
                            const aTypes = type.split('/');
                            if (typeof aTypes[1] !== 'undefined' && ~_this.aRestrictedExtensions.indexOf(aTypes[1].toLowerCase())) {
                                bx_alert(_t('_bx_messenger_file_type_is_not_allowed'));
                                return false;
                            }
                        }

                        if (_this.isBlockVersion && _this.oTarget !== null && !$(_this.oTarget).closest(_this.sMainObject).length)
                            return false;

                        return !(file instanceof Blob && !(file instanceof File) && ~type.toLowerCase().indexOf('text/html'));
                    },
                    onwarning: (oObject) => {
                        const {body, type} = oObject;
                        if (type === 'warning' && body === 'Max files') {
                            bx_alert(_t('_bx_messenger_max_files_upload_error', _this.maxFiles));
                        } else
                            console.log(oObject);

                    },
                    onprocessfiles: function () {
                        const aFiles = oUploader.getFiles(),
                            iProcessed = aFiles.filter(({status}) => +status === 5).length;

                        if (typeof _this.onUploadingComplete === 'function' && aFiles.length) {
                            const aProcessedFiles = aFiles.map(({
                                                                          file,
                                                                          status,
                                                                          source
                                                                      }) => ({
                                complete: +(status === 5),
                                name: file.name,
                                realname: source.name
                            }));

                            _this.onUploadingComplete(sName, aProcessedFiles, () => {
                                _this.removeInstance(sName);
                            });
                        }
                    },
                    onupdatefiles: function (files) {
                        _this.aFiles = files;

                        const aFilteredFiles = oUploader.getFiles().filter(({fileType}) => fileType !== 'application/octet-stream');
                        if (typeof _this.onUpdateAttachments === 'function')
                            _this.onUpdateAttachments(!aFilteredFiles.length);
                    },
                    onremovefile: function (error, { file }) {
                        const { name } = file;

                        if (name)
                            $.ajax({
                                url: _this.sTmpFileUrl,
                                type: 'DELETE',
                                data: { name }
                            });
                    },
                    onaddfile: function (oFile) {
                        if (typeof _this.onAddFilesCallback === 'function')
                            _this.onAddFilesCallback();
                    }
                });

            return oUploader;
        }(_this.sInputName));
    }

    removeInstance(sName){
        const oInstances = BxMessengerFilesUploader.instances;

        if (typeof oInstances !== 'undefined' && oInstances[sName]) {
            if (oInstances[sName].status !== FilePond.Status.BUSY) {
                oInstances[sName].destroy();
                delete oInstances[sName];
            }
        }
    }
    get instance(){
        if (!BxMessengerFilesUploader.instances || !this.sInputName)
            return this.oUploader;

        return BxMessengerFilesUploader.instances[this.sInputName];
    }
    getUploader(){
       const _this = this;

        if (typeof BxMessengerFilesUploader.instances === 'undefined')
            BxMessengerFilesUploader.instances = Object.create(null);

        return {
                isLoadingStarted:   () => _this.instance.status === FilePond.Status.BUSY,
                create:             (sName) => {
                                        _this.sInputName = sName ? sName : _this.setOption('input_name', 'filepond');
                                        BxMessengerFilesUploader.instances[_this.sInputName] = _this.init();
                                    },
                isReady:            () => _this.instance.status === FilePond.Status.READY,
                getFiles:           () => _this.instance.getFiles().filter((oFile) => oFile.status === 5).map(({ file }) => file.name),
                getAllFiles:        () => _this.instance.getFiles().map(({ file, status, source }) => ({ complete: +(status === 5), name: file.name, realname: source.name })),
                clean:              () => {
                                            if (typeof _this.onAddFilesCallback === 'function')
                                                _this.onAddFilesCallback();

                                             if (_this.instance.status === FilePond.Status.READY)
                                                 _this.instance.removeFiles();
                                          },
                name:               () => _this.instance.name,
                move:               (sID) => $(`[name="${_this.instance.name}"]`).closest('.filepond--root').appendTo(sID),
                browse:             () => _this.instance.browse(),
                removeFiles:        () => _this.instance.removeFiles(),
                removeCurrent:      () => {

                    _this.removeInstance(_this.instance.name);

                    // make the previous FilePond instance is active, if exists
                    const aKeys = Object.keys(BxMessengerFilesUploader.instances);
                    if (aKeys.length)
                        _this.sInputName = aKeys[aKeys.length - 1];
                },
                removeInstances:    () => {
                                            if (BxMessengerFilesUploader.instances){
                                                for(const sItem in BxMessengerFilesUploader.instances){
                                                    _this.removeInstance(sItem);
                                                }
                                            }
                                    },
              };
    }
}