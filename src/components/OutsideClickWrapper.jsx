import React from "react";
import PropTypes from "prop-types";
import onClickOutside from "react-onclickoutside";

class OutsideClickWrapper extends React.Component {
  static propTypes = {
    handleClickOutside: PropTypes.func.isRequired,
  };

  handleClickOutside() {
    this.props.handleClickOutside();
  }

  render() {
    return this.props.children;
  }
}

export default onClickOutside(OutsideClickWrapper);
