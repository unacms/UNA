import React, { useState } from 'react';
import 'react-quill/dist/quill.snow.css'; // import styles



export default function FormFieldFtf(props) {
  const [value, setValue] = useState('');
  const ReactQuill = require('react-quill');
  return <ReactQuill {...props} />;
}