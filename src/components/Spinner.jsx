import React, { Component } from "react";
import PropTypes from "prop-types";
import Loader from "react-loader";
import classNames from "classnames";

export default class Spinner extends Component {
  static propTypes = {
    loaded: PropTypes.bool,
    color: PropTypes.string,
    className: PropTypes.string,
    width: PropTypes.number,
    scale: PropTypes.number,
    top: PropTypes.string,
    left: PropTypes.string,
  };

  render() {
    const options = {
      lines: 13,
      length: 15,
      width: this.props.width || 6,
      radius: 20,
      corners: 1,
      rotate: 0,
      direction: 1,
      color: this.props.color ? this.props.color : "#333333",
      speed: 1,
      trail: 60,
      shadow: false,
      hwaccel: false,
      zIndex: 999,
      top: this.props.top || "50%",
      left: this.props.left || "50%",
      scale: this.props.scale || 1.0,
    };

    return (
      <div className={this.props.className}>
        <Loader loaded={this.props.loaded} options={options} loadedClassName={this.props.loadedClassName}>
          {this.props.children
            ? React.Children.map(this.props.children, (child) =>
                React.cloneElement(child, {
                  className: classNames("onLoaded", { onReady: this.props.loaded }),
                }),
              )
            : null}
        </Loader>
      </div>
    );
  }
}
