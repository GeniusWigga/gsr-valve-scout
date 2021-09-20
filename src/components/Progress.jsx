import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

export default class Progress extends Component {
  static propTypes = {
    progress: PropTypes.number.isRequired,
  };

  render() {
    const { progress } = this.props;

    const progressStyles = {
      width: `${progress}%`,
    };

    return <div className={classNames("progress-float", { finished: progress >= 100 })} style={progressStyles} />;
  }
}
