/** Static emulsion grain over the whole viewport. Not animated: moving grain
 *  costs a full-screen repaint every frame and reads as noise, not film. */
export const Grain = () => <div className="grain" aria-hidden="true" />;
