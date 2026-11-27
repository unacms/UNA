<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    DolphinMigration  Dolphin Migration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDolMConfig extends BxBaseModGeneralConfig
{
	/**
	 *  @var array una modules uris, associated with migration modules names (mainly uses for Timeline migration) 
	 */
	public $_aModulesAliases =	array(
		'bx_store' => 'store',
		'bx_files' => 'files',		
		'bx_poll' => 'polls',
		'bx_events' => 'events',
		'bx_groups' => 'groups',		
		'bx_blogs' => 'blogs',
		'bx_photos' => 'photos',
	);

    /**
     * @var bool allows to overwrite existed members profile data
     */
	public $_bIsOverwrite = false;

	/**
     * @var bool allows to transfer photo albums even if they are empty
     */
    public $_bTransferEmpty = true;

    public $_bMediaModulesContent = false;

    /**
     * @var bool allows to use members NickName instead of FullName
     */
    public $_bUseNickName = false;

    /**
     * @var integer contains default privacy value
     */
    public $_iDefaultPrivacyGroup = 3;

    /**
     * @var int interval in milliseconds for checking if the data already transferred but script still works.
     */
    public $_iCheckInterval = 60000;

    /**
     *  @var array modules for transfer from Dolphin to UNA with parameters
     *  	[table_name] -  (string) table from which to get data
     *  	[migration_class] - (string) class name/file name for data migration
     *  	[dependencies] -  (array) list of the modules which should be migrated before transferring selected module
     *  	[plugins] - (array) list of the modules which should be installed on UNA before transferring selected module
     */

    public $_aMigrationModules = array(
				'profiles' => array(
                    'table_name'     => 'Profiles', 
                    'migration_class' => 'BxDolMProfiles',
            		'dependencies' => array(
			        ),
					'plugins' => array(
						'bx_persons' => 'Persons',
			        ),
                ),
				'profile_fields' => array(
                    'table_name'		=> 'sys_profile_fields',
                    'migration_class'	=> 'BxDolMProfilesFields',
			        'dependencies' => array(
                        'profiles',
                    ),
					'plugins' => array(
						'bx_persons' => 'Persons',
			        ),
                ),				
				'blogs' => array(
                    'table_name'		=> 'bx_blogs_posts',					
                    'migration_class'	=> 'BxDolMBlogs',
					'type'				=> 'blog',
					'keywords'			=> 'bx_posts_meta_keywords',					
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_posts'		=> 'Posts'			
			        ),
                ),				
				'groups' => array(
                    'table_name'		=> 'bx_groups_main',
                    'migration_class'	=> 'BxDolMGroups',
					'type'				=> 'bx_groups',
					'keywords'			=> 'bx_groups_meta_keywords',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_groups'	=> 'Groups'					
			        ),
                ),
				'events' => array(
                    'table_name'		=> 'bx_events_main',
					'type'				=> 'bx_events',
					'keywords'			=> 'bx_events_meta_keywords',					
                    'migration_class'	=> 'BxDolMEvents',					
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_events'	=> 'Events'					
			        ),
                ),
				'photos_albums' => array(
                    'table_name'	=> 'bx_photos_main',	
					'table_name_albums' => 'sys_albums',
					'type'				=> 'bx_photos',
					'keywords'			=> 'bx_albums_meta_keywords_media',
                    'migration_class' => 'BxDolMPhotoAlbums',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_albums'		=> 'Albums'	
			        ),
                ),
                'photos' => array(
                    'table_name'	=> 'bx_photos_main',
                    'table_name_photos' => 'sys_albums',
                    'type'				=> 'bx_photos',
                    'keywords'			=> 'bx_photos_meta_keywords',
                    'migration_class' => 'BxDolMPhotos',
                    'dependencies' => array(
                        'profiles',
                    ),
                    'plugins' => array(
                        'bx_persons'	=> 'Persons',
                        'bx_photos'		=> 'Photos'
                    ),
                ),
				'videos_albums' => array(
                    'table_name'	=> 'RayVideoFiles',
					'table_name_albums' => 'sys_albums',
					'type'				=> 'bx_videos',
					'keywords'			=> 'bx_albums_meta_keywords_media',
                    'migration_class' => 'BxDolMVideoAlbums',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_albums'		=> 'Albums'	
			        ),
                ),
                'videos' => array(
                    'table_name'	=> 'RayVideoFiles',
                    'table_name_videos' => 'sys_albums',
                    'type'				=> 'bx_videos',
                    'keywords'			=> 'bx_videos_meta_keywords_media',
                    'migration_class'   => 'BxDolMVideos',
                    'dependencies' => array(
                        'profiles',
                    ),
                    'plugins' => array(
                        'bx_persons'	=> 'Persons'
                    ),
                ),
				'conversations' => array(
					'table_name'		=> 'sys_messages',					
                    'migration_class'	=> 'BxDolMConv',
					'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_convos'	=> 'Conversations'					
			        ),
                ),
				'forum' => array(
					'table_name' => 'bx_forum_topic',
					'table_name_post' => 'bx_forum_post',
                    'migration_class'	=> 'BxDolMForum',
					'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_forum'	=> 'Discussions'					
			        ),
                ),
				'polls' => array(
                    'table_name'		=> 'bx_poll_data',						
                    'migration_class'	=> 'BxDolMPolls',
					'type'				=> 'bx_poll',
					'keywords'			=> 'bx_polls_meta_keywords',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_polls'		=> 'Polls'	
			        ),
                ),
				'files' => array(
                    'table_name'		=> 'bx_files_main',
                    'migration_class'	=> 'BxDolMFiles',
					'type'				=> 'bx_files',
					'keywords'			=> 'bx_files_meta_keywords',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_files'	=> 'Files'					
			        ),
                ),
				'store' => array(
                    'table_name'		=> 'bx_store_products',
                    'migration_class'	=> 'BxDolMMarket',
					'type'				=> 'bx_store',
					'keywords'			=> 'bx_market_meta_keywords',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_market'	=> 'Market'
			        ),
                ),
				'quotes' => array(
                    'table_name'		=> 'bx_quotes_units',
                    'migration_class'	=> 'BxDolMQuotes',			        
					 'plugins' => array(						
						'bx_quoteofday'	=> 'Quotes'
			        ),
                ),
				'shoutbox' => array(
                    'table_name'		=> 'bx_shoutbox_messages',
                    'migration_class'	=> 'BxDolMShoutBox',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_messenger'	=> 'Jot Messenger'
			        ),
                ),
				'simple_messenger' => array(
                    'table_name'		=> 'bx_simple_messenger_messages',
                    'migration_class'	=> 'BxDolMSimpleMessenger',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_messenger'	=> 'Jot Messenger'
			        ),
                ),
				'chat' => array(
                    'table_name'		=> 'RayChatHistory',
                    'migration_class'	=> 'BxDolMChat',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_messenger'	=> 'Jot Messenger'
			        ),
                ),
				'timeline' => array(
                    'table_name' => 'bx_wall_events',
                    'migration_class'	=> 'BxDolMTimeline',
					'dependencies' => array
					(
                		'profiles',
                    ),
					'plugins' => array
					(
						'bx_persons'	=> 'Persons',
						'bx_timeline'	=> 'Timeline'		
			        ),
                ),
                'membership_levels' => array(
                    'table_name'		=> 'sys_acl_levels',
                    'migration_class'	=> 'BxDolMMemLevels',
                    'dependencies' => array(
                        'profiles',
                    ),
                    'plugins' => array(
                        'bx_acl'	=> 'Paid Levels'
                    ),
                )
             );
			 
	public function __construct($aModule)
	{
        $this -> _bIsOverwrite = getParam('bx_dolphin_migration_overwrite');
        $this -> _bTransferEmpty = getParam('bx_dolphin_migration_empty_albums');
        $this -> _bUseNickName = getParam('bx_dolphin_migration_use_nickname');
        $this -> _iDefaultPrivacyGroup = (int)getParam('bx_dolphin_migration_default_privacy');
        $this -> _bMediaModulesContent = getParam('bx_dolphin_migration_media_modules') == 'on';

        if ($this->_bMediaModulesContent){
            if ((int)BxDolModuleQuery::getInstance()->isEnabled('photos'))
                unset($this->_aMigrationModules['photos_albums']);
            else
                unset($this->_aMigrationModules['photos']);

            if ((int)BxDolModuleQuery::getInstance()->isEnabled('videos'))
                unset($this->_aMigrationModules['videos_albums']);
            else
                unset($this->_aMigrationModules['videos']);
        }
         else
         {
             unset($this->_aMigrationModules['photos']);
             unset($this->_aMigrationModules['videos']);
         }

        parent::__construct($aModule);
	}

}

/** @} */
