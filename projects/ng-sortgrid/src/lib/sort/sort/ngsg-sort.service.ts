import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { timer } from 'rxjs';

import { NgsgClassService } from '../../helpers/class/ngsg-class.service';
import { NgsgElementsHelper } from '../../helpers/element/ngsg-elements.helper';
import { NgsgDragelement } from '../../shared/ngsg-dragelement.model';
import { NgsgStoreService } from '../../store/ngsg-store.service';

@Injectable({
  providedIn: 'root',
})
export class NgsgSortService {
  private dragIndex: number;
  private dragElements: NgsgDragelement[];

  private renderer: Renderer2;

  constructor(
    private classService: NgsgClassService,
    private ngsgStore: NgsgStoreService,
    private rendererFactory: RendererFactory2,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  public initSort(group: string): void {
    this.dragIndex = this.ngsgStore.getFirstSelectItem(group).originalIndex;
    this.dragElements = this.ngsgStore.getSelectedItems(group);
  }

  public sort(dropElement: Element, parentElement?: Element): void {
    const hoverIndex = NgsgElementsHelper.findIndex(dropElement, parentElement);
    const el = this.getSibling(dropElement, this.dragIndex, hoverIndex);

    if (this.isDropInSelection(el)) {
      return;
    }

    this.dragElements.forEach((dragElement: NgsgDragelement) => {
      const previousListPartParentNode = dragElement.node.parentNode;
      const newListPartParentNode = dropElement.parentNode;

      if (previousListPartParentNode === newListPartParentNode) {
        this.handleMovingInsideTheSameListPart(dragElement, dropElement, el);
      } else {
        if (this.dragIndex > hoverIndex) {
          this.handleMovingToPrecedingListPart(dragElement, dropElement, el);
        } else {
          this.handleMovingToSucceedingListPart(dragElement, dropElement, el);
        }
      }

      this.classService.addPlaceHolderClass(dragElement.node as Element);
    });

    this.dragIndex = NgsgElementsHelper.findIndex(this.dragElements[0].node, parentElement);
  }

  private getElementIndexInParent(element: Node) {
    return Array.from(element.parentNode.children).indexOf(element as Element);
  }

  private handleMovingInsideTheSameListPart(dragElement: NgsgDragelement, dropElement: Element, el: NgsgDragelement) {
    this.moveElement(dropElement.parentNode, dragElement.node, el.node);
  }

  private handleMovingToPrecedingListPart(dragElement: NgsgDragelement, dropElement: Element, el: NgsgDragelement) {
    const previousListPartParentNode = dragElement.node.parentNode;
    const newListPartParentNode = dropElement.parentNode;

    const previousListPartIndex = this.getElementIndexInParent(previousListPartParentNode);
    const newListPartIndex = this.getElementIndexInParent(newListPartParentNode);

    const allListParts = previousListPartParentNode.parentNode.children;

    const newListPartElements = newListPartParentNode.children;
    const newListPartLastElement = newListPartElements.item(newListPartElements.length - 1);

    // for every list part between newListPart and previousListPart:
    // move their lastElement before the firstElement of succeeding list part
    for (let i = newListPartIndex; i < previousListPartIndex; i++) {
      const precedingListPart = allListParts[i];
      const succeedingListPart = allListParts[i + 1];

      const precedingListPartLastChild = precedingListPart.lastElementChild;
      const succeedingListPartFirstChild = succeedingListPart.firstElementChild;

      this.moveElement(succeedingListPart, precedingListPartLastChild, succeedingListPartFirstChild);
    }

    const draggedToLastNewListPartPosition = newListPartLastElement === dropElement;

    if (draggedToLastNewListPartPosition) {
      this.moveElement(newListPartParentNode, dragElement.node, null);
    } else {
      this.moveElement(dropElement.parentNode, dragElement.node, el.node);
    }
  }

  private handleMovingToSucceedingListPart(dragElement: NgsgDragelement, dropElement: Element, el: NgsgDragelement) {
    const previousListPartParentNode = dragElement.node.parentNode;
    const newListPartParentNode = dropElement.parentNode;

    const previousListPartIndex = this.getElementIndexInParent(previousListPartParentNode);
    const newListPartIndex = this.getElementIndexInParent(newListPartParentNode);

    const allListParts = previousListPartParentNode.parentNode.children;

    const newListPartElements = newListPartParentNode.children;
    const newListPartFirstElement = newListPartElements.item(0);

    // for every list part between previousListPart and newListPart:
    // move the first element of succeeding list part to the end of preceding list part
    for (let i = previousListPartIndex; i < newListPartIndex; i++) {
      const precedingListPart = allListParts[i];
      const succeedingListPart = allListParts[i + 1];

      const succeedingListPartFirstChild = succeedingListPart.firstElementChild;

      this.moveElement(precedingListPart, succeedingListPartFirstChild, null);
    }

    const draggedToFirstNewListPartPosition = newListPartFirstElement === dropElement;

    if (draggedToFirstNewListPartPosition) {
      this.moveElement(newListPartParentNode, dragElement.node, newListPartElements.item(0));
    } else {
      this.moveElement(dropElement.parentNode, dragElement.node, el.node);
    }
  }

  private moveElement(parentNode: Node, elementNode: Element, destinationNode: Node) {
    this.renderer.insertBefore(parentNode, elementNode, destinationNode, true);
  }

  public endSort(): void {
    this.dragElements.forEach((dragElement: NgsgDragelement) => {
      this.updateDropedItem(dragElement.node);
    });
  }

  private getSibling(dropElement: any, dragIndex: number, hoverIndex: number): NgsgDragelement | null {
    if (dragIndex < hoverIndex) {
      return {node: dropElement.nextSibling, originalIndex: hoverIndex + 1};
    }
    return {node: dropElement, originalIndex: hoverIndex};
  }

  private isDropInSelection(dropElement: NgsgDragelement): boolean {
    return !!this.dragElements.find((dragElement: NgsgDragelement) => dragElement.node === dropElement.node);
  }

  private updateDropedItem(item: Element): void {
    this.classService.removePlaceHolderClass(item);
    this.classService.addDroppedClass(item);
    this.classService.removeSelectedClass(item);
    this.classService.removeActiveClass(item);
    timer(500).subscribe(() => this.classService.removeDroppedClass(item));
  }
}
