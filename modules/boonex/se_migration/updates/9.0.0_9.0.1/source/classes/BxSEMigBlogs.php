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

require_once('BxSEMigData.php');
bx_import('BxDolStorage');
	
class BxSEMigBlogs extends BxSEMigData {	
	public function BxSEMigBlogs (&$oMigrationModule, &$oSE) {
        parent::BxSEMigData($oMigrationModule, $oSE);
    }    
	
	public function getTotalRecords(){
		return (int)$this -> _seDb -> getOne("SELECT COUNT(*) FROM `{$this -> _sEnginePrefix}blog_blogs`");			
	}
	
	public function runMigration () {        
		if (!$this -> getTotalRecords()){
			  $this -> setResultStatus(_t('_bx_se_migration_no_data_to_transfer'));
	          return BX_SEMIG_SUCCESSFUL;
		}	
		
		$this -> setResultStatus(_t('_bx_se_migration_started_migration_blogs'));
		
		$aResult = $this -> _seDb -> getAll("SELECT * FROM `{$this -> _sEnginePrefix}blog_blogs` ORDER BY `blog_id`");		
		
		$iComments = 0;		
		foreach($aResult as $iKey => $aValue){ 
			$iProfileId = $this -> getContentId((int)$aValue['owner_id']);			
			if (!$iProfileId || $this -> isBlogExisted($iProfileId, $aValue['title'])) continue;
			
			$sQuery = $this -> _oDb -> prepare( 
                     "
                     	INSERT INTO
                     		`bx_posts_posts`
                     	SET
                     		`author`   			= ?,
                     		`added`      		= ?,
                     		`changed`   		= ?,
							`thumb`				= 0,
							`title`				= ?,		
                     		`text`				= ?,
							`views`				= ?,
							`comments`			= ?,
							`status`			= 'active',
							`cat`				= ?	
                     ", 
						$iProfileId, 
						isset($aValue['creation_date']) ? strtotime($aValue['creation_date']) : time(), 
						isset($aValue['modified_date']) ? strtotime($aValue['modified_date']) : time(), 
						isset($aValue['title']) && $aValue['title'] ? $aValue['title'] : '',
						isset($aValue['body']) && $aValue['body'] ? $aValue['body'] : '',
						(int)$aValue['view_count'],
						(int)$aValue['comment_count'],
						(int)$aValue['category_id']
						);			
		
			$this -> _oDb -> query($sQuery);
			
			$iBlogId = $this -> _oDb -> lastId();					
			
			if (!$iBlogId){
				$this -> setResultStatus(_t('_bx_se_migration_started_migration_blogs_error', (int)$aValue['blog_id']));
	            return BX_SEMIG_FAILED;
			}	

			$iComments += $this -> transferComments((int)$aValue['blog_id'], $iBlogId, $iProfileId);			
			$this -> _iTransferred++;
         }      	
        
		$iCategories = 0;
		if ($this -> _iTransferred) $iCategories = $this -> transferCategories();

        // set as finished;
        $this -> setResultStatus(_t('_bx_se_migration_started_migration_blogs_finished', $this -> _iTransferred, $iComments, $iCategories));
        return BX_SEMIG_SUCCESSFUL;
    }

   /**
	* Returns Post's plugin Languages Category ID
	* @return Integer
         */      
	private function getPostsCategoryId(){
		return (int)$this -> _oDb -> getOne("SELECT `ID` FROM `sys_localization_categories` WHERE `Name` = 'Posts' LIMIT 1");
	}
	
	/**
	* Check if category already transferred
	* @param int $iID category ID
	* @param string $sName language key	
	* @return Boolean
         */  
	private function isCategoryExisted($iID, $sName){		
		$sQuery = $this -> _oDb -> prepare("SELECT COUNT(*) FROM `sys_form_pre_values` WHERE `Value` = ? AND `LKey` = ? LIMIT 1", $iID, $sName);
		return (int)$this -> _oDb -> getOne($sQuery) == 1;
	}
	
	/**
	* Transfers all categories
	* @return Integer
         */ 
	private function transferCategories(){
    	$oLanguage = BxDolStudioLanguagesUtils::getInstance();
		$iPostsCategoryId = $this -> getPostsCategoryId(); 
		
		/* get all blogs categories from SE*/
		$aSECategories = $this -> _seDb -> getPairs("SELECT * FROM  `{$this -> _sEnginePrefix}blog_categories` ORDER BY `category_id` ASC", 'category_id', 'category_name');
		if (empty($aSECategories) || !$iPostsCategoryId) return false;
		
		/*  remove all current posts categories */
		$aCategories = $this -> _oDb -> getPairs("SELECT * FROM  `sys_form_pre_values` WHERE `Key` = 'bx_posts_cats'  AND `Value` <> '' ORDER BY `Order` ASC", 'Value', 'LKey');			
		foreach($aCategories as $iKey => $sValue){ 
			$oLanguage -> deleteLanguageString($sValue);
			$this -> _oDb -> query("DELETE FROM `sys_form_pre_values` WHERE `Key` = 'bx_posts_cats' AND `LKey` = '{$sValue}'");
		}						
		
		/*  transfer  blogs categories  from Social Engine */
		$iTransferred  = 0;	
		foreach($aSECategories as $iKey => $sValue){ 
			$sValue = bx_process_input($sValue);				
			if ($this -> isCategoryExisted($iKey, $sValue)) continue;
				$sKey = '_bx_posts_cats_' . $sValue;
															
				$sQuery = $this -> _oDb -> prepare("INSERT INTO `sys_form_pre_values` SET 
													`Key` = 'bx_posts_cats', 
													`Value` = ?, 
													`Order` = ?, 
													`LKey` = ?", 
													$iKey, 
													$iKey, 
													$sKey);
                /*add new Language Keys*/
				$oLanguage -> addLanguageString($sKey, $sValue, 0, $iPostsCategoryId);										
				if ($this -> _oDb -> query($sQuery)) $iTransferred++;
		}		   
		
		if ($iTransferred) 
		
		return $iTransferred;
   }
   /**
	* Check if Blog already transferred  by Author ID and Blog's Title
	* @param int $iAuthor social engine's profile ID
	* @param string $sTitle blog's title
	* @return Boolean
         */     
    private function isBlogExisted($iAuthor, $sTitle){    	
		$sQuery  = $this -> _oDb ->  prepare("SELECT COUNT(*) FROM `bx_posts_posts` WHERE `author` = ? AND `title` = ? LIMIT 1", $iAuthor, $sTitle);
        return (bool)$this -> _oDb -> getOne($sQuery);
    }
   
   /**
	* Transfer all Blogs' Comments
	* @param int $iOldBlogId social engine's blog's ID
	* @param int $iNewBlogId una post's ID		
	* @return Integer
         */  	
	private function transferComments($iOldBlogId, $iNewBlogId){
		$aComments = $this -> _seDb -> getAll("SELECT * FROM  `{$this -> _sEnginePrefix}core_comments` WHERE `resource_type` = 'blog' AND `resource_id` = '{$iOldBlogId}' AND  `poster_type` = 'user' ORDER BY `comment_id` ASC");
		if (empty($aComments)) return false;
		
		$iComments = 0;
		foreach($aComments as $iKey => $aComment){			
			$iProfileId = $this -> getContentId($aComment['poster_id']);
			$sQuery = $this -> _oDb -> prepare("INSERT INTO `bx_posts_cmts` SET
										`cmt_object_id`		= ?,
										`cmt_author_id`		= ?,
										`cmt_text`			= ?,
										`cmt_rate_count`	= ?,	
										`cmt_time`			= ?
									", 
									$iNewBlogId,
									$iProfileId,
									bx_process_input($aComment['body']),
									(int)$aComment['like_count'],
									isset($aComment['creation_date']) ? strtotime($aComment['creation_date']) : time()
									); 
			
			$this -> _oDb -> query($sQuery);
			$iComments++;
		}
		
		return $iComments;
	}	
}

/** @} */
