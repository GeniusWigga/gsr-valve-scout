import React from "react";
import * as _ from "lodash";
import QuestionsAnimationWrapper from "./QuestionsAnimationWrapper.jsx";

export default class QuestionsWrapper extends React.Component {
  render() {
    const { currentAnswers, addAnswers, handleHelpTextInformation, children } = this.props;

    const childrenArray = React.Children.toArray(children);

    const currentAnswerKeys = _.keys(currentAnswers);

    const maxQuestionNumber = _.reduce(
      childrenArray,
      (maxQuestionNumber, child, index) => {
        const answerKeys = _.get(child, ["props", "question", "answerKeys"], []);
        const questionNumber = index + 1;

        if (_.intersection(currentAnswerKeys, answerKeys).length === answerKeys.length) {
          return questionNumber + 1 >= maxQuestionNumber ? questionNumber + 1 : maxQuestionNumber;
        }
        if (_.intersection(currentAnswerKeys, answerKeys).length >= 1) {
          return questionNumber >= maxQuestionNumber ? questionNumber : maxQuestionNumber;
        }
        return maxQuestionNumber;
      },
      1,
    );

    return (
      <QuestionsAnimationWrapper currentAnswers={currentAnswers}>
        {_.map(_.slice(childrenArray, 0, maxQuestionNumber), (child, index) =>
          React.cloneElement(child, {
            question: {
              ...child.props.question,
              number: index + 1,
            },
            handleHelpTextInformation,
            addAnswers,
          }),
        )}
      </QuestionsAnimationWrapper>
    );
  }
}
