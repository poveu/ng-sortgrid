export class NgsgElementsHelper {

  public static findIndex(element: Element, parentElement?: Element): number {
    const allElements = parentElement
      ? parentElement.querySelectorAll(element.tagName)
      : element.parentNode.children;

    return Array.prototype.indexOf.call(allElements, element);
  }
}
