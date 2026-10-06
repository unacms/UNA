import { memo } from 'react'
import CourseStructure from './course-structure'

/**
 * Course modules in edit mode. The add / edit / delete / reorder flow (the
 * bx_courses_cnt_structure_manage grid forms in the bottom sheet) lives in
 * course-structure.js behind UNA's `isEditable` flag, so this renders it with the
 * same payload ({ items, entry_id, isEditable }), editable unless UNA says no.
 */
function EditCourseContent({ data }) {
    return <CourseStructure data={{ ...data, isEditable: data?.isEditable ?? true }} />
}

export default memo(EditCourseContent);
