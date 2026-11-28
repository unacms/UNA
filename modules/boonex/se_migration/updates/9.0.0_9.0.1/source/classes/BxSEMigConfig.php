<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    SocialEngineMigration SocialEngine Migration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxSEMigConfig extends BxBaseModGeneralConfig {
	/**
	* @$_aMigrationModules modules's data for transferring array
	* @section comments Comments
	* @ref BxDolCmts
	*/
	public $_aMigrationModules = array(
               'profiles' => array(
                    'table_name'     => 'users',
                    'migration_class' => 'BxSEMigProfiles',
            		'dependencies' => array(
			        ),
					'plugins' => array(
						'bx_persons' => 'Persons',
			        ),
                ),
				'profile_fields' => array(
                    'table_name'		=> 'user_fields_meta',
                    'migration_class'	=> 'BxSEMigProfilesFields',
			        'dependencies' => array(
                        'profiles',
                    ),
					'plugins' => array(
						'bx_persons' => 'Persons',
			        ),
                ),
				
				'blogs' => array(
                    'table_name'		=> 'blog_blogs',
                    'migration_class'	=> 'BxSEMigBlogs',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_posts'		=> 'Posts'					
			        ),
                ),
				
				'photos' => array(
                    'table_name'		=> 'album_albums',
                    'migration_class' 	=> 'BxSEMigPhotoAlbums',
			        'dependencies' => array(
                		'profiles',
                     ),
					 'plugins' => array(
						'bx_persons'	=> 'Persons',
						'bx_albums'		=> 'Albums'	
			        ),
                )               
             );
			 
   public function __construct($aModule){
        parent::__construct($aModule); 
		
		$this -> CNF = array (
            'ENGINE_V' => 'se_migration_version',		
		);
   }

   public function getEngineVersionPrefix(){
		return getParam($this -> CNF['ENGINE_V']) . '_';
   }   
}

/** @} */
