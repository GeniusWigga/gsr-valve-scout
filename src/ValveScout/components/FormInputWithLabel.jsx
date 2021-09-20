import React from "react";
import classnames from "classnames";

export default class FormInputWithLabel extends React.Component {
  render() {
    const { label, type, name, handleChange, value, onBlur } = this.props;
    return (
      <div className={classnames(name, "form-input-label-wrapper")}>
        <label htmlFor={name}>{label}</label>
        <div className="input-wrapper">
          <input id={name} name={name} type={type} onChange={handleChange} onBlur={onBlur} value={value || ""} />
        </div>
      </div>
    );
  }
}
