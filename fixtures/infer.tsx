import React from 'react';
import { Button, ButtonGroup, ConfirmationDialog } from './ui';

export function Screen() {
  return (
    <>
      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <Button variant="secondary">Cancel</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="primary">Publish</Button>
        <Button variant="danger">Delete</Button>
        <ConfirmationDialog title="Are you sure?" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="primary">Send</Button>
      </ButtonGroup>
    </>
  );
}
