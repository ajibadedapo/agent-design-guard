import React from 'react';
import {
  Box,
  Button,
  IconButton,
  ButtonGroup,
  Dialog,
  Field,
  ConfirmDialog,
  TitleBar,
  PageActions,
  Text
} from './ui';

export function Good() {
  return (
    <>
      <Box color="color.action.primary" />

      <Button variant="primary" label="Adjust" />

      <Button variant="danger" requiresConfirmation label="Remove" />

      <ButtonGroup>
        <Button variant="primary" label="Save" />
        <Button variant="secondary" label="Cancel" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="danger" reversible={false} requiresConfirmation label="Delete" />
        <ConfirmDialog title="Delete this item?" />
      </ButtonGroup>

      <Dialog.Footer>
        <Button variant="secondary" label="Cancel" />
        <Button variant="primary" label="Submit" />
      </Dialog.Footer>

      <Dialog title="Details">
        <Text label="Read only content" />
      </Dialog>

      <ButtonGroup>
        <Button variant="secondary" size="md" label="One" />
        <Button variant="secondary" size="md" label="Two" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="primary" label="Alpha" />
        <Button variant="secondary" label="Beta" />
      </ButtonGroup>

      <ButtonGroup>
        <Button variant="secondary" label="Discard draft" />
      </ButtonGroup>

      <Dialog title="Edit profile" fullScreen>
        <form>
          <Field label="Email" />
        </form>
      </Dialog>

      <ButtonGroup>
        <IconButton aria-label="More" />
        <IconButton aria-label="Less" />
      </ButtonGroup>

      <TitleBar>
        <Button variant="primary" label="Save" />
      </TitleBar>
      <PageActions>
        <Button variant="primary" label="Save" />
      </PageActions>
    </>
  );
}
