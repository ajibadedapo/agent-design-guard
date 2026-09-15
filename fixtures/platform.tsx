import React from 'react';
import { Dialog, Button, BottomSheet } from './ui';

export function DestructiveFlow() {
  return (
    <Dialog role="dialog">
      <Button variant="danger" reversible={false} requiresConfirmation label="Delete" />
      <BottomSheet role="alertdialog" title="Delete this item?" />
    </Dialog>
  );
}
