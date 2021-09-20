import React, { Component } from "react";
import _ from "lodash";
import classnames from "classnames";
import RadioInput from "./RadioInput.jsx";
import OperatingPressureInput from "./OperatingPressureInput.jsx";
import ToolTip from "./ToolTip.jsx";

export default class AnswerWrapper extends Component {
  render() {
    const { children, name, className, id = name } = this.props;

    return (
      <div className={classnames("answer", className, id)}>
        <div id={id} className="wrapper">
          {React.Children.map(children, (child) => {
            const type = child && child.type ? child.type : null;

            if ((type && _.isEqual(type, RadioInput)) || _.isEqual(type, OperatingPressureInput)) {
              return React.cloneElement(child, { ...this.props });
            }
            return child;
          })}
          <ToolTip questionId={id} />
        </div>
      </div>
    );
  }
}
